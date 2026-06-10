// netlify/functions/live-data.js
// Live World Cup 2026 data aggregator with multi-API support and Supabase caching
//
// Sources: API-Football (primary), TheStatsAPI (analytics), TheSportsDB (free fallback)
// Cache: Supabase (60s for live, 1h for non-live)
//
// Endpoints:
//   ?source=matches        — Today's WC2026 matches with live scores
//   ?source=standings      — Group standings computed from match_results
//   ?source=lineups&match_id=N — Starting XI + subs for a match
//   ?source=players        — Squad/player data
//   ?source=live           — Only currently-live or upcoming (within 2h) matches
//   ?source=refresh        — Force-fetch from API and update cache

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || null;
const THESTATSAPI_KEY = process.env.THESTATSAPI_KEY || null;

// API endpoints
const API_FOOTBALL_BASE = 'https://api-football-v1.p.rapidapi.com/v3';
const THESTATSD_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// Cache TTLs (seconds)
const TTL = {
  live: 60,       // live data refreshes every 60s
  matches: 3600,  // match data caches for 1 hour
  standings: 3600,
  lineups: 7200,  // lineups don't change often
  players: 21600, // player data changes rarely
  default: 3600
};

// Rate limit tracking (in-memory, resets on cold start)
const rateLimitState = {
  apiFootball: { used: 0, limit: 100, resetAt: null },
  theStatsAPI: { used: 0, limit: 500, resetAt: null },
  // TheSportsDB is free/unlimited
};

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Full World Cup 2026 fixture definition (same as match-schedule.js)
const GROUP_STAGE_FIXTURES = [
  { id: 1, round: 'group', group: 'A', home: 'Mexico', away: 'South Africa', date: '2026-06-11T16:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 2, round: 'group', group: 'A', home: 'Korea Republic', away: 'Czechia', date: '2026-06-12T13:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 3, round: 'group', group: 'A', home: 'Mexico', away: 'Korea Republic', date: '2026-06-16T20:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 4, round: 'group', group: 'A', home: 'South Africa', away: 'Czechia', date: '2026-06-16T16:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 5, round: 'group', group: 'A', home: 'Mexico', away: 'Czechia', date: '2026-06-21T20:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 6, round: 'group', group: 'A', home: 'South Africa', away: 'Korea Republic', date: '2026-06-21T16:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 7, round: 'group', group: 'B', home: 'Canada', away: 'Bosnia and Herzegovina', date: '2026-06-12T20:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 8, round: 'group', group: 'B', home: 'Qatar', away: 'Switzerland', date: '2026-06-12T16:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 9, round: 'group', group: 'B', home: 'Canada', away: 'Qatar', date: '2026-06-17T20:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 10, round: 'group', group: 'B', home: 'Bosnia and Herzegovina', away: 'Switzerland', date: '2026-06-17T16:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 11, round: 'group', group: 'B', home: 'Canada', away: 'Switzerland', date: '2026-06-22T20:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 12, round: 'group', group: 'B', home: 'Bosnia and Herzegovina', away: 'Qatar', date: '2026-06-22T16:00:00Z', venue: 'CenturyLink Field, Seattle' },
  { id: 13, round: 'group', group: 'C', home: 'Brazil', away: 'Morocco', date: '2026-06-13T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 14, round: 'group', group: 'C', home: 'Haiti', away: 'Scotland', date: '2026-06-13T16:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { id: 15, round: 'group', group: 'C', home: 'Brazil', away: 'Haiti', date: '2026-06-17T13:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 16, round: 'group', group: 'C', home: 'Morocco', away: 'Scotland', date: '2026-06-18T16:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 17, round: 'group', group: 'C', home: 'Brazil', away: 'Scotland', date: '2026-06-23T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 18, round: 'group', group: 'C', home: 'Morocco', away: 'Haiti', date: '2026-06-23T16:00:00Z', venue: 'Estadio Universitario, Monterrey' },
  { id: 19, round: 'group', group: 'D', home: 'USA', away: 'Paraguay', date: '2026-06-13T13:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 20, round: 'group', group: 'D', home: 'Australia', away: 'Türkiye', date: '2026-06-14T16:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 21, round: 'group', group: 'D', home: 'USA', away: 'Australia', date: '2026-06-18T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 22, round: 'group', group: 'D', home: 'Paraguay', away: 'Türkiye', date: '2026-06-18T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 23, round: 'group', group: 'D', home: 'USA', away: 'Türkiye', date: '2026-06-24T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 24, round: 'group', group: 'D', home: 'Paraguay', away: 'Australia', date: '2026-06-24T16:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 25, round: 'group', group: 'E', home: 'Germany', away: 'Curaçao', date: '2026-06-14T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 26, round: 'group', group: 'E', home: "Côte d'Ivoire", away: 'Ecuador', date: '2026-06-14T13:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 27, round: 'group', group: 'E', home: 'Germany', away: "Côte d'Ivoire", date: '2026-06-19T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 28, round: 'group', group: 'E', home: 'Curaçao', away: 'Ecuador', date: '2026-06-19T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 29, round: 'group', group: 'E', home: 'Germany', away: 'Ecuador', date: '2026-06-25T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 30, round: 'group', group: 'E', home: 'Curaçao', away: "Côte d'Ivoire", date: '2026-06-25T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 31, round: 'group', group: 'F', home: 'Netherlands', away: 'Japan', date: '2026-06-15T20:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 32, round: 'group', group: 'F', home: 'Sweden', away: 'Tunisia', date: '2026-06-15T16:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 33, round: 'group', group: 'F', home: 'Netherlands', away: 'Sweden', date: '2026-06-19T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 34, round: 'group', group: 'F', home: 'Japan', away: 'Tunisia', date: '2026-06-20T16:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { id: 35, round: 'group', group: 'F', home: 'Netherlands', away: 'Tunisia', date: '2026-06-25T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 36, round: 'group', group: 'F', home: 'Japan', away: 'Sweden', date: '2026-06-26T16:00:00Z', venue: 'Estadio Universitario, Monterrey' },
  { id: 37, round: 'group', group: 'G', home: 'Belgium', away: 'Egypt', date: '2026-06-15T13:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 38, round: 'group', group: 'G', home: 'IR Iran', away: 'New Zealand', date: '2026-06-16T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 39, round: 'group', group: 'G', home: 'Belgium', away: 'IR Iran', date: '2026-06-20T20:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 40, round: 'group', group: 'G', home: 'Egypt', away: 'New Zealand', date: '2026-06-20T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 41, round: 'group', group: 'G', home: 'Belgium', away: 'New Zealand', date: '2026-06-26T20:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 42, round: 'group', group: 'G', home: 'Egypt', away: 'IR Iran', date: '2026-06-26T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 43, round: 'group', group: 'H', home: 'Spain', away: 'Cabo Verde', date: '2026-06-14T13:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 44, round: 'group', group: 'H', home: 'Saudi Arabia', away: 'Uruguay', date: '2026-06-15T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 45, round: 'group', group: 'H', home: 'Spain', away: 'Saudi Arabia', date: '2026-06-20T13:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 46, round: 'group', group: 'H', home: 'Cabo Verde', away: 'Uruguay', date: '2026-06-21T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 47, round: 'group', group: 'H', home: 'Spain', away: 'Uruguay', date: '2026-06-25T13:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 48, round: 'group', group: 'H', home: 'Cabo Verde', away: 'Saudi Arabia', date: '2026-06-27T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 49, round: 'group', group: 'I', home: 'France', away: 'Senegal', date: '2026-06-17T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 50, round: 'group', group: 'I', home: 'Iraq', away: 'Norway', date: '2026-06-18T13:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 51, round: 'group', group: 'I', home: 'France', away: 'Iraq', date: '2026-06-22T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 52, round: 'group', group: 'I', home: 'Senegal', away: 'Norway', date: '2026-06-22T13:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 53, round: 'group', group: 'I', home: 'France', away: 'Norway', date: '2026-06-27T20:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 54, round: 'group', group: 'I', home: 'Senegal', away: 'Iraq', date: '2026-06-27T13:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 55, round: 'group', group: 'J', home: 'Argentina', away: 'Algeria', date: '2026-06-16T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 56, round: 'group', group: 'J', home: 'Austria', away: 'Jordan', date: '2026-06-17T13:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 57, round: 'group', group: 'J', home: 'Argentina', away: 'Austria', date: '2026-06-21T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 58, round: 'group', group: 'J', home: 'Algeria', away: 'Jordan', date: '2026-06-21T13:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 59, round: 'group', group: 'J', home: 'Argentina', away: 'Jordan', date: '2026-06-26T13:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 60, round: 'group', group: 'J', home: 'Algeria', away: 'Austria', date: '2026-06-27T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 61, round: 'group', group: 'K', home: 'Portugal', away: 'Congo DR', date: '2026-06-13T13:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 62, round: 'group', group: 'K', home: 'Uzbekistan', away: 'Colombia', date: '2026-06-14T20:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 63, round: 'group', group: 'K', home: 'Portugal', away: 'Uzbekistan', date: '2026-06-18T20:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 64, round: 'group', group: 'K', home: 'Congo DR', away: 'Colombia', date: '2026-06-19T13:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 65, round: 'group', group: 'K', home: 'Portugal', away: 'Colombia', date: '2026-06-23T16:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 66, round: 'group', group: 'K', home: 'Congo DR', away: 'Uzbekistan', date: '2026-06-24T13:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 67, round: 'group', group: 'L', home: 'England', away: 'Croatia', date: '2026-06-11T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 68, round: 'group', group: 'L', home: 'Ghana', away: 'Panama', date: '2026-06-12T16:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { id: 69, round: 'group', group: 'L', home: 'England', away: 'Ghana', date: '2026-06-16T16:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 70, round: 'group', group: 'L', home: 'Croatia', away: 'Panama', date: '2026-06-17T16:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 71, round: 'group', group: 'L', home: 'England', away: 'Panama', date: '2026-06-22T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 72, round: 'group', group: 'L', home: 'Croatia', away: 'Ghana', date: '2026-06-23T13:00:00Z', venue: 'Lumen Field, Seattle' }
];

const KNOCKOUT_FIXTURES = [
  { id: 73, round: 'round32', home: 'A2', away: 'B2', date: '2026-06-28T16:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 74, round: 'round32', home: 'E1', away: '3rd(ABCD F)', date: '2026-06-29T16:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 75, round: 'round32', home: 'F1', away: 'C2', date: '2026-06-29T20:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 76, round: 'round32', home: 'C1', away: 'F2', date: '2026-06-29T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 77, round: 'round32', home: 'I1', away: '3rd(CDFGH)', date: '2026-06-30T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 78, round: 'round32', home: 'E2', away: 'I2', date: '2026-06-30T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 79, round: 'round32', home: 'A1', away: '3rd(CEFHI)', date: '2026-06-30T13:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 80, round: 'round32', home: 'L1', away: '3rd(EHIJK)', date: '2026-07-01T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 81, round: 'round32', home: 'D1', away: '3rd(BEFIJ)', date: '2026-07-01T20:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { id: 82, round: 'round32', home: 'G1', away: '3rd(AEHIJ)', date: '2026-07-01T13:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 83, round: 'round32', home: 'K2', away: 'L2', date: '2026-07-02T20:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 84, round: 'round32', home: 'H1', away: 'J2', date: '2026-07-02T16:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 85, round: 'round32', home: 'B1', away: '3rd(EFGIJ)', date: '2026-07-02T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 86, round: 'round32', home: 'J1', away: 'H2', date: '2026-07-03T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 87, round: 'round32', home: 'K1', away: '3rd(DEIJL)', date: '2026-07-03T16:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 88, round: 'round32', home: 'D2', away: 'G2', date: '2026-07-03T13:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 89, round: 'round16', home: 'Winner 74', away: 'Winner 77', date: '2026-07-04T16:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 90, round: 'round16', home: 'Winner 73', away: 'Winner 75', date: '2026-07-04T20:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 91, round: 'round16', home: 'Winner 76', away: 'Winner 78', date: '2026-07-05T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 92, round: 'round16', home: 'Winner 79', away: 'Winner 80', date: '2026-07-05T20:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 93, round: 'round16', home: 'Winner 83', away: 'Winner 84', date: '2026-07-06T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 94, round: 'round16', home: 'Winner 81', away: 'Winner 82', date: '2026-07-06T16:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 95, round: 'round16', home: 'Winner 86', away: 'Winner 88', date: '2026-07-07T20:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 96, round: 'round16', home: 'Winner 85', away: 'Winner 87', date: '2026-07-07T16:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 97, round: 'quarter', home: 'Winner 89', away: 'Winner 90', date: '2026-07-09T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 98, round: 'quarter', home: 'Winner 93', away: 'Winner 94', date: '2026-07-10T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 99, round: 'quarter', home: 'Winner 91', away: 'Winner 92', date: '2026-07-11T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 100, round: 'quarter', home: 'Winner 95', away: 'Winner 96', date: '2026-07-11T20:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 101, round: 'semi', home: 'Winner 97', away: 'Winner 98', date: '2026-07-14T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 102, round: 'semi', home: 'Winner 99', away: 'Winner 100', date: '2026-07-15T20:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 103, round: 'thirdPlace', home: 'Loser 101', away: 'Loser 102', date: '2026-07-18T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 104, round: 'final', home: 'Winner 101', away: 'Winner 102', date: '2026-07-19T15:00:00Z', venue: 'MetLife Stadium, NJ/NY' }
];

const ALL_FIXTURES = [...GROUP_STAGE_FIXTURES, ...KNOCKOUT_FIXTURES];

// World Cup 2026 team list (all 48 teams)
const WC2026_TEAMS = [
  'Mexico', 'South Africa', 'Korea Republic', 'Czechia',
  'Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland',
  'Brazil', 'Morocco', 'Haiti', 'Scotland',
  'USA', 'Paraguay', 'Australia', 'Türkiye',
  'Germany', 'Curaçao', "Côte d'Ivoire", 'Ecuador',
  'Netherlands', 'Japan', 'Sweden', 'Tunisia',
  'Belgium', 'Egypt', 'IR Iran', 'New Zealand',
  'Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay',
  'France', 'Senegal', 'Iraq', 'Norway',
  'Argentina', 'Algeria', 'Austria', 'Jordan',
  'Portugal', 'Congo DR', 'Uzbekistan', 'Colombia',
  'England', 'Croatia', 'Ghana', 'Panama'
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function createResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...getCorsHeaders(), ...extraHeaders },
    body: JSON.stringify(body)
  };
}

function supabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Check the cache for data. Returns { hit, data, meta } where hit is boolean.
 * Uses the `live_cache` table with a TTL column.
 * Falls back to `match_results` for backward compatibility.
 */
async function checkCache(source, matchId) {
  const supabase = supabaseClient();
  const cacheKey = matchId ? `${source}:${matchId}` : source;
  const isLive = source === 'live';
  const ttl = isLive ? TTL.live : (TTL[source] || TTL.default);

  // Try the dedicated live_cache table first
  const { data: cached } = await supabase
    .from('live_cache')
    .select('cache_key, data, source, updated_at')
    .eq('cache_key', cacheKey)
    .single();

  if (cached && cached.data) {
    const age = (Date.now() - new Date(cached.updated_at).getTime()) / 1000;
    if (age < ttl) {
      console.log(`[live-data] Cache HIT for ${cacheKey} (age: ${Math.round(age)}s, ttl: ${ttl}s)`);
      return { hit: true, data: cached.data, source: cached.source, stale: false };
    }
    console.log(`[live-data] Cache STALE for ${cacheKey} (age: ${Math.round(age)}s, ttl: ${ttl}s)`);
    return { hit: true, data: cached.data, source: cached.source, stale: true };
  }

  return { hit: false, data: null, source: null, stale: false };
}

/**
 * Store data in the live_cache table.
 * Also updates match_results for backward compatibility if the data contains scores.
 */
async function writeCache(source, data, meta = {}) {
  const supabase = supabaseClient();
  const cacheKey = meta.matchId ? `${source}:${meta.matchId}` : source;

  try {
    // Upsert into live_cache
    const { error } = await supabase
      .from('live_cache')
      .upsert({
        cache_key: cacheKey,
        source: meta.apiSource || source,
        data: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });

    if (error) {
      console.error(`[live-data] Error writing cache for ${cacheKey}:`, error.message);
    }
  } catch (err) {
    console.error(`[live-data] Failed to write cache for ${cacheKey}:`, err.message);
  }

  // Also update match_results if this is match data with scores
  if (source === 'matches' || source === 'live') {
    const matches = Array.isArray(data) ? data : (data.matches || [data]);
    for (const match of matches) {
      if (match.matchId || match.id) {
        const mid = match.matchId || match.id;
        await supabase
          .from('match_results')
          .upsert({
            match_id: mid,
            home_score: match.homeScore ?? match.home_score ?? null,
            away_score: match.awayScore ?? match.away_score ?? null,
            status: match.status || match.status || 'scheduled',
            updated_at: new Date().toISOString()
          }, { onConflict: 'match_id' })
          .catch(e => console.error(`[live-data] Error writing match ${mid} to match_results:`, e.message));
      }
    }
  }
}

/**
 * Check if we're rate-limited for a given API.
 */
function isRateLimited(apiName) {
  const state = rateLimitState[apiName];
  if (!state) return false;
  if (state.resetAt && Date.now() > state.resetAt) {
    state.used = 0;
    state.resetAt = null;
    return false;
  }
  return state.used >= state.limit;
}

/**
 * Track an API call for rate limiting.
 */
function trackApiCall(apiName) {
  const state = rateLimitState[apiName];
  if (!state) return;
  state.used++;
  // Reset window: 24h from first call
  if (!state.resetAt) {
    state.resetAt = Date.now() + 24 * 60 * 60 * 1000;
  }
}

/**
 * Fetch from API-Football via RapidAPI.
 */
async function fetchFromApiFootball(endpoint, params = {}) {
  if (!RAPIDAPI_KEY) {
    console.log('[live-data] No RAPIDAPI_KEY set, skipping API-Football');
    return null;
  }
  if (isRateLimited('apiFootball')) {
    console.log('[live-data] API-Football rate limited');
    return null;
  }

  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_FOOTBALL_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    console.log(`[live-data] Fetching API-Football: ${url}`);
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });
    trackApiCall('apiFootball');
    if (!response.ok) {
      console.error(`[live-data] API-Football error ${response.status}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`[live-data] API-Football fetch error:`, err.message);
    return null;
  }
}

/**
 * Fetch from TheSportsDB (free, unlimited).
 */
async function fetchFromSportsDB(endpoint) {
  const url = `${THESTATSD_BASE}/${endpoint}`;
  try {
    console.log(`[live-data] Fetching TheSportsDB: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[live-data] TheSportsDB error ${response.status}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`[live-data] TheSportsDB fetch error:`, err.message);
    return null;
  }
}

/**
 * Fetch from TheStatsAPI.
 */
async function fetchFromTheStatsAPI(endpoint, params = {}) {
  if (!THESTATSAPI_KEY) {
    console.log('[live-data] No THESTATSAPI_KEY set, skipping TheStatsAPI');
    return null;
  }
  if (isRateLimited('theStatsAPI')) {
    console.log('[live-data] TheStatsAPI rate limited');
    return null;
  }

  const queryString = Object.entries({ ...params, apiKey: THESTATSAPI_KEY })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `https://api.thestatsapi.com/v1/${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    console.log(`[live-data] Fetching TheStatsAPI: ${url}`);
    const response = await fetch(url);
    trackApiCall('theStatsAPI');
    if (!response.ok) {
      console.error(`[live-data] TheStatsAPI error ${response.status}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`[live-data] TheStatsAPI fetch error:`, err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA TRANSFORMERS: API-specific → unified format
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform API-Football fixture response into our unified match format.
 */
function transformApiFootballMatches(apiData) {
  if (!apiData || !apiData.response) return [];
  return apiData.response.map(f => {
    const isLive = f.fixture.status.short === '1H' || f.fixture.status.short === '2H' ||
                   f.fixture.status.short === 'HT' || f.fixture.status.short === 'ET' ||
                   f.fixture.status.short === 'P' || f.fixture.status.short === 'LIVE';
    const isFinished = f.fixture.status.short === 'FT' || f.fixture.status.short === 'AET' ||
                       f.fixture.status.short === 'PEN' || f.fixture.status.short === 'FF';
    const isScheduled = f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD';

    let status = 'scheduled';
    if (isLive) status = 'live';
    else if (isFinished) status = 'completed';

    return {
      matchId: f.fixture.id,
      date: f.fixture.date,
      venue: f.fixture.venue?.name || null,
      status: status,
      statusShort: f.fixture.status.short || null,
      minute: isLive ? (f.fixture.status.elapsed || 0) : null,
      homeTeam: f.teams.home.name,
      homeLogo: f.teams.home.logo || null,
      homeScore: f.goals.home,
      homeHalfScore: f.score?.halftime?.home || null,
      awayTeam: f.teams.away.name,
      awayLogo: f.teams.away.logo || null,
      awayScore: f.goals.away,
      awayHalfScore: f.score?.halftime?.away || null,
      events: (f.events || []).map(e => ({
        time: e.time?.elapsed,
        team: e.team?.name,
        player: e.player?.name,
        type: e.type,
        detail: e.detail
      })),
      league: {
        id: f.league?.id,
        name: f.league?.name,
        season: f.league?.season,
        round: f.league?.round
      }
    };
  });
}

/**
 * Transform TheSportsDB events into unified format.
 */
function transformSportsDBMatches(apiData) {
  if (!apiData || !apiData.events) return [];
  return apiData.events.map(e => ({
    matchId: parseInt(e.idEvent, 10),
    date: e.strTimestamp || e.dateEvent,
    venue: e.strVenue || null,
    status: e.strStatus === 'Match Finished' ? 'completed'
           : e.strStatus === 'Live' ? 'live'
           : e.strStatus || 'scheduled',
    statusShort: e.strStatus || null,
    minute: e.intScore ? null : null,
    homeTeam: e.strHomeTeam,
    homeLogo: e.strThumb || null,
    homeScore: parseInt(e.intHomeScore, 10) || null,
    awayTeam: e.strAwayTeam,
    awayLogo: null,
    awayScore: parseInt(e.intAwayScore, 10) || null,
    events: []
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SOURCE: matches — get today's matches with live scores.
 * Fetches from API-Football, falls back to TheSportsDB, then to local schedule.
 */
async function handleMatches(params) {
  const todayStr = new Date().toISOString().split('T')[0];
  let matches = [];

  // 1. Try API-Football for today's fixtures
  let apiData = await fetchFromApiFootball('fixtures', {
    date: todayStr,
    season: '2026',
    league: '1' // FIFA World Cup
  });

  if (apiData) {
    matches = transformApiFootballMatches(apiData);
  }

  // 2. If no API results, try TheSportsDB
  if (matches.length === 0) {
    const sportsDbData = await fetchFromSportsDB(`eventsday.php?d=${todayStr}&s=Soccer`);
    if (sportsDbData) {
      matches = transformSportsDBMatches(sportsDbData);
    }
  }

  // 3. If still no results, use local fixture data merged with Supabase match_results
  if (matches.length === 0) {
    matches = await buildLocalMatchData(true); // today only
  }

  // 4. Cache the results
  await writeCache('matches', matches, { apiSource: apiData ? 'api-football' : 'sportsdb' });

  return {
    source: apiData ? 'api-football' : (matches.length > 0 ? 'local' : 'sportsdb'),
    matches: matches,
    count: matches.length,
    date: todayStr
  };
}

/**
 * Build match data from local fixture definitions merged with Supabase results.
 */
async function buildLocalMatchData(todayOnly = false) {
  const supabase = supabaseClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: results } = await supabase
    .from('match_results')
    .select('match_id, home_score, away_score, status');

  const resultMap = {};
  if (results) {
    results.forEach(r => { resultMap[r.match_id] = r; });
  }

  let fixtures = todayOnly
    ? ALL_FIXTURES.filter(m => m.date && m.date.startsWith(todayStr))
    : ALL_FIXTURES;

  return fixtures.map(f => ({
    matchId: f.id,
    date: f.date,
    venue: f.venue || null,
    status: resultMap[f.id]?.status || 'scheduled',
    statusShort: resultMap[f.id]?.status === 'completed' ? 'FT'
                : resultMap[f.id]?.status === 'live' ? 'LIVE'
                : 'NS',
    minute: resultMap[f.id]?.status === 'live' ? 45 : null,
    homeTeam: f.home,
    homeLogo: null,
    homeScore: resultMap[f.id]?.home_score ?? null,
    awayTeam: f.away,
    awayLogo: null,
    awayScore: resultMap[f.id]?.away_score ?? null,
    round: f.round || 'group',
    group: f.group || null,
    events: []
  }));
}

/**
 * SOURCE: standings — compute group standings from match_results.
 */
async function handleStandings() {
  const supabase = supabaseClient();

  const { data: results } = await supabase
    .from('match_results')
    .select('match_id, home_score, away_score, status');

  const resultMap = {};
  if (results) {
    results.forEach(r => { resultMap[r.match_id] = r; });
  }

  // Helper: get teams in a group
  function getGroupTeams(groupLetter) {
    const groupFixtures = GROUP_STAGE_FIXTURES.filter(f => f.group === groupLetter);
    const teams = new Set();
    groupFixtures.forEach(f => { teams.add(f.home); teams.add(f.away); });
    return Array.from(teams);
  }

  // Helper: get all group fixtures
  function getGroupFixtures(groupLetter) {
    return GROUP_STAGE_FIXTURES.filter(f => f.group === groupLetter);
  }

  // Compute standings for each group
  const standings = {};
  GROUP_LETTERS.forEach(letter => {
    const teams = getGroupTeams(letter);
    const fixtures = getGroupFixtures(letter);

    const stats = {};
    teams.forEach(t => {
      stats[t] = { pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };
    });

    fixtures.forEach(f => {
      const result = resultMap[f.id];
      if (!result || result.status !== 'completed') return;
      const homeScore = result.home_score;
      const awayScore = result.away_score;
      if (homeScore === null || awayScore === null) return;

      stats[f.home].gf += homeScore;
      stats[f.home].ga += awayScore;
      stats[f.home].played++;
      stats[f.away].gf += awayScore;
      stats[f.away].ga += homeScore;
      stats[f.away].played++;

      if (homeScore > awayScore) stats[f.home].pts += 3;
      else if (awayScore > homeScore) stats[f.away].pts += 3;
      else { stats[f.home].pts += 1; stats[f.away].pts += 1; }
    });

    // Calculate GD
    Object.keys(stats).forEach(t => {
      stats[t].gd = stats[t].gf - stats[t].ga;
    });

    const sorted = teams.sort((a, b) => {
      if (stats[b].pts !== stats[a].pts) return stats[b].pts - stats[a].pts;
      if (stats[b].gd !== stats[a].gd) return stats[b].gd - stats[a].gd;
      return stats[b].gf - stats[a].gf;
    });

    standings[letter] = {
      group: letter,
      teams: sorted.map((team, idx) => ({
        position: idx + 1,
        team: team,
        ...stats[team]
      }))
    };
  });

  // Determine best third-place teams
  const thirdPlaceData = [];
  GROUP_LETTERS.forEach(letter => {
    const groupStanding = standings[letter];
    if (!groupStanding || groupStanding.teams.length < 3) return;
    const third = groupStanding.teams[2];
    thirdPlaceData.push({
      group: letter,
      team: third.team,
      pts: third.pts,
      gd: third.gd,
      gf: third.gf
    });
  });

  thirdPlaceData.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  return {
    standings: standings,
    bestThirdPlace: thirdPlaceData.slice(0, 8),
    roundOf32Qualifiers: thirdPlaceData.slice(0, 8).map(d => d.group)
  };
}

/**
 * SOURCE: lineups — get starting XI and subs for a match.
 */
async function handleLineups(matchId) {
  if (!matchId) {
    return { error: 'match_id parameter required' };
  }

  // Try API-Football for lineups
  let apiData = await fetchFromApiFootball('fixtures/lineups', { fixture: matchId });

  if (apiData && apiData.response) {
    const transformed = apiData.response.map(team => ({
      team: team.team?.name,
      teamId: team.team?.id,
      coach: team.coach?.name || null,
      formation: team.formation || null,
      startingXI: (team.startXI || []).map(p => ({
        number: p.player?.number,
        name: p.player?.name,
        pos: p.player?.pos
      })),
      substitutes: (team.substitutes || []).map(p => ({
        number: p.player?.number,
        name: p.player?.name,
        pos: p.player?.pos
      }))
    }));

    await writeCache('lineups', transformed, { matchId });
    return { matchId, lineups: transformed, source: 'api-football' };
  }

  // Fallback: generate simulated lineups based on tournament structure
  return generateDummyLineups(matchId);
}

/**
 * SOURCE: players — list of WC2026 squads.
 */
async function handlePlayers() {
  // Try TheSportsDB for player/squad data
  const sportsDbData = await fetchFromSportsDB('search_all_teams.php?l=English%20Premier%20League&s=Soccer');

  // For World Cup squads, fall back to structured dummy data
  return generateDummyPlayerData();
}

/**
 * SOURCE: live — only currently-live or matches starting within 2 hours.
 */
async function handleLive() {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Try API-Football for live matches first
  const apiData = await fetchFromApiFootball('fixtures', {
    live: 'all',
    season: '2026',
    league: '1'
  });

  let liveMatches = [];
  if (apiData) {
    liveMatches = transformApiFootballMatches(apiData)
      .filter(m => m.status === 'live');
  }

  // Also check local fixtures for upcoming matches
  const localMatches = await buildLocalMatchData(false);
  const upcoming = localMatches.filter(m => {
    if (m.status === 'live') return true;
    if (m.status !== 'scheduled') return false;
    const matchDate = new Date(m.date);
    return matchDate > now && matchDate <= twoHoursLater;
  });

  // Merge: live matches first, then upcoming, dedup by matchId
  const seen = new Set();
  const merged = [];

  const allSources = [
    ...liveMatches.map(m => ({ ...m, _source: 'api-football' })),
    ...upcoming.map(m => ({ ...m, _source: 'local' }))
  ];

  for (const match of allSources) {
    if (!seen.has(match.matchId)) {
      seen.add(match.matchId);
      merged.push(match);
    }
  }

  await writeCache('live', merged, { apiSource: apiData ? 'api-football' : 'local' });

  return {
    liveCount: liveMatches.length,
    upcomingCount: upcoming.length,
    matches: merged,
    generatedAt: now.toISOString()
  };
}

/**
 * SOURCE: refresh — force-fetch from APIs and update the cache.
 */
async function handleRefresh() {
  const results = {
    matches: null,
    live: null,
    errors: []
  };

  // Force refresh matches
  try {
    const matchesData = await handleMatches({});
    results.matches = { count: matchesData.matches.length, source: matchesData.source };
  } catch (err) {
    results.errors.push({ source: 'matches', error: err.message });
  }

  // Force refresh live
  try {
    const liveData = await handleLive();
    results.live = { count: liveData.matches.length };
  } catch (err) {
    results.errors.push({ source: 'live', error: err.message });
  }

  return {
    refreshed: results.errors.length === 0,
    results,
    timestamp: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUMMY / FALLBACK DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate dummy lineups for a match when APIs are unavailable.
 */
function generateDummyLineups(matchId) {
  // Find the fixture
  const fixture = ALL_FIXTURES.find(f => f.id === parseInt(matchId, 10) || f.id === matchId);
  if (!fixture) {
    return { matchId, lineups: [], note: 'Match not found in schedule' };
  }

  const positions = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'];
  const benchPositions = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD'];

  const homeXI = positions.map((pos, i) => ({
    number: i + 1,
    name: `${fixture.home} Player ${i + 1}`,
    pos: pos
  }));

  const homeSubs = benchPositions.map((pos, i) => ({
    number: 12 + i,
    name: `${fixture.home} Sub ${i + 1}`,
    pos: pos
  }));

  const awayXI = positions.map((pos, i) => ({
    number: i + 1,
    name: `${fixture.away} Player ${i + 1}`,
    pos: pos
  }));

  const awaySubs = benchPositions.map((pos, i) => ({
    number: 12 + i,
    name: `${fixture.away} Sub ${i + 1}`,
    pos: pos
  }));

  return {
    matchId,
    lineups: [
      {
        team: fixture.home,
        formation: '4-3-3',
        startingXI: homeXI,
        substitutes: homeSubs
      },
      {
        team: fixture.away,
        formation: '4-3-3',
        startingXI: awayXI,
        substitutes: awaySubs
      }
    ],
    source: 'local-dummy',
    note: 'Dummy data — set API keys for real lineups'
  };
}

/**
 * Generate dummy player data for all WC2026 teams.
 */
function generateDummyPlayerData() {
  const groups = {};

  GROUP_LETTERS.forEach(letter => {
    const groupFixtures = GROUP_STAGE_FIXTURES.filter(f => f.group === letter);
    const teamNames = [...new Set(groupFixtures.flatMap(f => [f.home, f.away]))];

    groups[letter] = teamNames.map(team => ({
      team: team,
      players: [
        { name: `${team} GK 1`, position: 'Goalkeeper', number: 1 },
        { name: `${team} DEF 2`, position: 'Defender', number: 2 },
        { name: `${team} DEF 3`, position: 'Defender', number: 3 },
        { name: `${team} DEF 4`, position: 'Defender', number: 4 },
        { name: `${team} DEF 5`, position: 'Defender', number: 5 },
        { name: `${team} MID 6`, position: 'Midfielder', number: 6 },
        { name: `${team} MID 7`, position: 'Midfielder', number: 7 },
        { name: `${team} MID 8`, position: 'Midfielder', number: 8 },
        { name: `${team} MID 9`, position: 'Midfielder', number: 9 },
        { name: `${team} FWD 10`, position: 'Forward', number: 10 },
        { name: `${team} FWD 11`, position: 'Forward', number: 11 }
      ]
    }));
  });

  return {
    groups,
    totalTeams: WC2026_TEAMS.length,
    source: 'local-dummy',
    note: 'Dummy data — set API keys for real player data'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { ok: true });
  }

  const params = event.queryStringParameters || {};
  const source = params.source || 'matches';
  const matchId = params.match_id || params.matchId || null;
  const bypassCache = params.refresh === 'true' || source === 'refresh';

  console.log(`[live-data] Request: source=${source}, matchId=${matchId}, bypassCache=${bypassCache}`);

  try {
    // Rate limit check for non-force requests
    if (!bypassCache && source !== 'refresh') {
      const cacheCheck = await checkCache(source, matchId);

      if (cacheCheck.hit && !cacheCheck.stale) {
        console.log(`[live-data] Serving from cache for ${source}`);
        return createResponse(200, {
          source: cacheCheck.source || 'cache',
          cached: true,
          data: cacheCheck.data,
          generatedAt: new Date().toISOString()
        });
      }
    }

    // Route to the appropriate handler
    let result;
    switch (source) {
      case 'matches':
        result = await handleMatches(params);
        break;
      case 'standings':
        result = await handleStandings();
        break;
      case 'lineups':
        result = await handleLineups(matchId);
        break;
      case 'players':
        result = await handlePlayers();
        break;
      case 'live':
        result = await handleLive();
        break;
      case 'refresh':
        result = await handleRefresh();
        break;
      default:
        return createResponse(400, { error: `Unknown source: ${source}` });
    }

    // Add rate limit info
    result._rateLimits = {
      apiFootball: { ...rateLimitState.apiFootball },
      theStatsAPI: { ...rateLimitState.theStatsAPI }
    };

    return createResponse(200, {
      ...result,
      cached: false,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[live-data] Error handling source=${source}:`, error.message, error.stack);
    return createResponse(500, {
      error: 'Internal server error',
      detail: error.message,
      source: source
    });
  }
};
