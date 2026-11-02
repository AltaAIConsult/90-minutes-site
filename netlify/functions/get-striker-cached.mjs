// Serves cached StrikerAPI standings from Netlify Blobs. Never calls StrikerAPI on a normal
// page load; the only exception is a league with no cache entry at all (e.g. right after the
// first deploy), which is fetched once and stored so later loads read from Blobs.
// Query: ?league=mls|argentina|europa-league|conference-league (omit to get all four)
import { STRIKER_LEAGUES, strikerStore, refreshLeague } from '../lib/striker.mjs';

async function readLeague(store, key) {
    const cached = await store.get(STRIKER_LEAGUES[key].blobKey, { type: 'json' });
    if (cached) return cached;
    if (!process.env.STRIKER_API_KEY) return null;
    try {
        return await refreshLeague(key);
    } catch (err) {
        console.error(`Initial StrikerAPI fetch for ${key} failed:`, err);
        return null;
    }
}

export default async (req) => {
    const requested = new URL(req.url).searchParams.get('league');
    if (requested && !STRIKER_LEAGUES[requested]) {
        return Response.json({ error: 'Unknown league' }, { status: 400 });
    }
    const keys = requested ? [requested] : Object.keys(STRIKER_LEAGUES);

    try {
        const store = strikerStore();
        const entries = await Promise.all(keys.map((key) => readLeague(store, key)));
        const leagues = Object.fromEntries(keys.map((key, i) => [key, entries[i]]));
        const complete = entries.every(Boolean);

        return Response.json({ leagues }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                // Short CDN cache keeps Blob reads light; data only changes twice a day anyway
                'Netlify-CDN-Cache-Control': complete
                    ? 'public, durable, s-maxage=1800, stale-while-revalidate=3600'
                    : 'no-store'
            }
        });
    } catch (err) {
        console.error('get-striker-cached failed:', err);
        return Response.json({ error: 'Failed to read cached standings' }, { status: 500 });
    }
};
