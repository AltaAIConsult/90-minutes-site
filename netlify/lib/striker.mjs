// Shared StrikerAPI + Netlify Blobs cache logic.
// Lives outside netlify/functions so it isn't deployed as its own endpoint.
import { getStore } from '@netlify/blobs';

const STRIKER_ENDPOINT = 'https://mcp.strikerapi.com/v1/get_standings';
const STORE_NAME = 'striker-cache';

// key: id used by the frontend; slug: StrikerAPI league slug; blobKey: cache entry name
export const STRIKER_LEAGUES = {
    mls: { slug: 'mls', blobKey: 'striker-mls' },
    argentina: { slug: 'argentina', blobKey: 'striker-argentina' },
    'europa-league': { slug: 'uel', blobKey: 'striker-europa-league' },
    'conference-league': { slug: 'uecl', blobKey: 'striker-conference-league' }
};

export function strikerStore() {
    return getStore({ name: STORE_NAME, consistency: 'strong' });
}

async function fetchStandings(slug) {
    const res = await fetch(STRIKER_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.STRIKER_API_KEY
        },
        // season omitted: StrikerAPI defaults to the latest season for each league
        body: JSON.stringify({ league: slug })
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(`StrikerAPI ${slug} failed (${res.status}): ${body?.error || body?.message || 'unknown error'}`);
    }
    // REST responses wrap the payload in `data`
    const payload = body?.data ?? body;
    if (!payload || !Array.isArray(payload.standings)) {
        throw new Error(`StrikerAPI ${slug} returned no standings`);
    }
    return payload;
}

// Fetches one league and writes it to Blobs. Returns the cached entry.
export async function refreshLeague(key) {
    const league = STRIKER_LEAGUES[key];
    if (!league) throw new Error(`Unknown league ${key}`);
    const payload = await fetchStandings(league.slug);
    const entry = {
        league: key,
        updatedAt: new Date().toISOString(),
        season: payload.season ?? null,
        standings: payload.standings
    };
    await strikerStore().setJSON(league.blobKey, entry);
    return entry;
}

// Refreshes leagues. When minAgeMs is set, leagues cached more recently than that are skipped
// so repeated calls can't burn through StrikerAPI credits.
export async function refreshAll({ minAgeMs = 0 } = {}) {
    if (!process.env.STRIKER_API_KEY) throw new Error('STRIKER_API_KEY is not configured');
    const store = strikerStore();
    const results = {};
    for (const key of Object.keys(STRIKER_LEAGUES)) {
        try {
            if (minAgeMs > 0) {
                const existing = await store.get(STRIKER_LEAGUES[key].blobKey, { type: 'json' });
                if (existing?.updatedAt && Date.now() - Date.parse(existing.updatedAt) < minAgeMs) {
                    results[key] = { status: 'skipped', updatedAt: existing.updatedAt };
                    continue;
                }
            }
            const entry = await refreshLeague(key);
            results[key] = { status: 'updated', updatedAt: entry.updatedAt, rows: entry.standings.length };
        } catch (err) {
            console.error(err);
            results[key] = { status: 'error', error: err.message };
        }
    }
    return results;
}
