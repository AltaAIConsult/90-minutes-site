// Refreshes the StrikerAPI cache twice a day.
// Netlify cron schedules run in UTC: 06:00 and 20:00 UTC.
import { refreshAll } from '../lib/striker.mjs';

export default async () => {
    // Runs the same refresh as fetch-striker-data, called directly (no extra HTTP hop).
    // A small min age guards against duplicate invocations without blocking the twice-daily run.
    const results = await refreshAll({ minAgeMs: 60 * 60 * 1000 });
    console.log('StrikerAPI cache refresh:', JSON.stringify(results));
};

export const config = {
    schedule: '0 6,20 * * *'
};
