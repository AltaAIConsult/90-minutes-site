// Proxies football-data.org so the API key stays server-side.
// Query params: type ("standings" | "scorers"), competition (league code, e.g. PL)

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

function json(body, status, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders }
    });
}

export default async (req) => {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const competition = (url.searchParams.get('competition') || '').toUpperCase();

    if (type !== 'standings' && type !== 'scorers') {
        return json({ error: 'type must be "standings" or "scorers"' }, 400);
    }
    if (!/^[A-Z0-9]{2,5}$/.test(competition)) {
        return json({ error: 'Invalid competition code' }, 400);
    }
    if (!process.env.FOOTBALL_DATA_API_KEY) {
        return json({ error: 'Football data API key is not configured' }, 500);
    }

    try {
        const res = await fetch(
            `https://api.football-data.org/v4/competitions/${competition}/${type === 'standings' ? 'standings' : 'scorers'}`,
            { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY } }
        );
        const data = await res.json();

        if (!res.ok) {
            return json({ error: data?.message || 'Upstream request failed' }, res.status);
        }

        // Cache successful responses at the CDN so page loads don't burn through the API rate limit
        return json(data, 200, {
            'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=900, stale-while-revalidate=3600'
        });
    } catch (err) {
        console.error(`get-football-data failed for ${competition}/${type}:`, err);
        return json({ error: 'Failed to fetch football data' }, 502);
    }
};
