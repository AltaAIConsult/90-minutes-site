// Pulls MLS, Argentina, Europa League and Conference League standings from StrikerAPI
// and stores them in Netlify Blobs. Normally triggered by scheduled-update.mjs.
// When hit over HTTP, leagues refreshed in the last 8 hours are skipped so the
// public URL can't be used to drain StrikerAPI credits.
import { refreshAll } from '../lib/striker.mjs';

const MIN_AGE_MS = 8 * 60 * 60 * 1000;

export default async () => {
    try {
        const results = await refreshAll({ minAgeMs: MIN_AGE_MS });
        return Response.json({ results });
    } catch (err) {
        console.error('fetch-striker-data failed:', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
};
