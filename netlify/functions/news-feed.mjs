// Fetches several football RSS feeds server-side and returns normalized JSON:
// [{ title, link, pubDate, source, description, thumbnail }] (newest first, max 20)

const FEEDS = [
    { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN', domain: 'https://www.espn.com' },
    { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport', domain: 'https://www.bbc.co.uk' },
    { url: 'https://www.theguardian.com/football/rss', source: 'The Guardian', domain: 'https://www.theguardian.com' },
    { url: 'http://www.ole.com.ar/rss/futbol-internacional/', source: 'Olé', domain: 'https://www.ole.com.ar' },
    { url: 'https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/portada/', source: 'Diario AS', domain: 'https://as.com' },
    { url: 'https://e00-marca.uecdn.es/rss/futbol.xml', source: 'Marca', domain: 'https://www.marca.com' }
];

const MAX_ARTICLES = 20;
// Some feeds (e.g. ESPN) stamp every item with the feed's build time, so cap each source to keep the mix varied
const MAX_PER_SOURCE = 4;
const FETCH_TIMEOUT_MS = 5000;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(str) {
    return str.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
        if (code[0] === '#') {
            const num = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(num) ? String.fromCodePoint(num) : match;
        }
        return ENTITIES[code.toLowerCase()] ?? match;
    });
}

// Returns the text content of the first <tag> in the given XML, handling CDATA
function getTagText(xml, tag) {
    const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
    if (!match) return '';
    const raw = match[1].trim();
    const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    return cdata ? cdata[1].trim() : decodeEntities(raw);
}

// Returns an attribute value from the first <tag ...> in the given XML
function getTagAttr(xml, tag, attr, filter) {
    const tags = xml.match(new RegExp(`<${tag}\\s[^>]*>`, 'gi')) || [];
    for (const t of tags) {
        if (filter && !filter(t)) continue;
        const match = t.match(new RegExp(`\\s${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
        if (match) return decodeEntities(match[1]);
    }
    return null;
}

function isImageTag(tag) {
    const type = tag.match(/\stype\s*=\s*["']([^"']+)["']/i);
    const medium = tag.match(/\smedium\s*=\s*["']([^"']+)["']/i);
    if (type) return type[1].startsWith('image');
    if (medium) return medium[1] === 'image';
    return true;
}

// Feeds like The Guardian list several sizes per item, so pick the widest image
function getLargestMediaContent(itemXml) {
    const tags = (itemXml.match(/<media:content\s[^>]*>/gi) || []).filter(isImageTag);
    let best = null;
    let bestWidth = -1;
    for (const t of tags) {
        const url = t.match(/\surl\s*=\s*["']([^"']+)["']/i);
        if (!url) continue;
        const width = parseInt((t.match(/\swidth\s*=\s*["']?(\d+)/i) || [])[1] || '0', 10);
        if (width > bestWidth) {
            best = decodeEntities(url[1]);
            bestWidth = width;
        }
    }
    return best;
}

function absolutize(url, baseUrl) {
    if (!url) return null;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return url.replace(/^http:\/\//i, 'https://');
}

function extractThumbnail(itemXml, description) {
    const fromEnclosure = getTagAttr(itemXml, 'enclosure', 'url', isImageTag);
    if (fromEnclosure) return fromEnclosure;

    const fromMediaContent = getLargestMediaContent(itemXml);
    if (fromMediaContent) return fromMediaContent;

    const fromMediaThumbnail = getTagAttr(itemXml, 'media:thumbnail', 'url');
    if (fromMediaThumbnail) return fromMediaThumbnail;

    const contentEncoded = getTagText(itemXml, 'content:encoded');
    for (const html of [description, contentEncoded]) {
        const imgMatch = html && html.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
        if (imgMatch) return decodeEntities(imgMatch[1]);
    }
    return null;
}

function parseFeed(xml, feed) {
    const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
    return items.map(itemXml => {
        const description = getTagText(itemXml, 'description');
        let link = getTagText(itemXml, 'link');
        if (!link) {
            const guid = getTagText(itemXml, 'guid');
            if (/^(https?:\/\/|\/)/i.test(guid)) link = guid;
        }

        const date = new Date(getTagText(itemXml, 'pubDate'));

        return {
            title: getTagText(itemXml, 'title') || 'Untitled',
            link: absolutize(link, feed.domain) || '#',
            pubDate: isNaN(date) ? new Date().toISOString() : date.toISOString(),
            source: feed.source,
            description: decodeEntities(description.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(),
            thumbnail: absolutize(extractThumbnail(itemXml, description), feed.domain)
        };
    });
}

async function fetchFeed(feed) {
    try {
        const res = await fetch(feed.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; 90MinutesOrMore/1.0; +https://90minutesormore.com)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const articles = parseFeed(await res.text(), feed)
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, MAX_PER_SOURCE);
        console.log(`✅ ${feed.source}: ${articles.length} articles`);
        return articles;
    } catch (error) {
        console.error(`✗ Failed to fetch ${feed.source} feed:`, error.message);
        return [];
    }
}

export default async () => {
    const results = await Promise.all(FEEDS.map(fetchFeed));
    const articles = results
        .flat()
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, MAX_ARTICLES);

    return new Response(JSON.stringify(articles), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
            // Cache at the edge for 5 minutes so feeds stay fresh without hitting sources on every view
            'Netlify-CDN-Cache-Control': 'public, durable, max-age=300, stale-while-revalidate=120'
        }
    });
};
