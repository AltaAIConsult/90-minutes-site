// netlify/functions/youtube-podcasts.js
// Auto-fetches podcast episodes from YouTube Data API v3, caches in Supabase
// Falls back to Sanity podcast data if YouTube API is unavailable
//
// Cache: Supabase live_cache (key='youtube_podcasts', TTL=6h)
//
// Env vars:
//   YOUTUBE_API_KEY           — Google Cloud API key (YouTube Data API v3 enabled)
//   YOUTUBE_CHANNEL_ID        — (optional) Channel ID for "90 Minutes or More"
//   SUPABASE_URL              — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key
//   SANITY_PROJECT_ID         — (optional, defaults to llmrml4v)
//   SANITY_DATASET            — (optional, defaults to production)

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || null;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || null;
const CHANNEL_NAME = '90 Minutes or More';
const CACHE_KEY = 'youtube_podcasts';
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const MAX_VIDEOS = 15;

// Sanity fallback config
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'llmrml4v';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';

// YouTube API base
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: getCorsHeaders(),
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
 * Parse ISO 8601 duration (e.g. PT1M30S, PT30S, PT1H2M10S) into total seconds.
 */
function parseISODuration(duration) {
  const match = duration.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Check if a video is a Short (duration < 60 seconds or title contains #shorts).
 */
function isShort(videoDetails) {
  const durationSec = parseISODuration(videoDetails.contentDetails?.duration || 'PT0S');
  if (durationSec < 60) return true;
  const title = (videoDetails.snippet?.title || '').toLowerCase();
  if (title.includes('#shorts')) return true;
  return false;
}

/**
 * Format a single video item into our podcast episode format.
 */
function formatEpisode(videoDetails) {
  const videoId = videoDetails.id;
  const snippet = videoDetails.snippet || {};

  return {
    title: snippet.title || 'Untitled Episode',
    videoId: videoId,
    description: snippet.description || '',
    thumbnail: snippet.thumbnails?.maxres?.url
      || snippet.thumbnails?.high?.url
      || snippet.thumbnails?.medium?.url
      || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    publishedAt: snippet.publishedAt || new Date().toISOString(),
    youtubeLink: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`
  };
}

// ─── YOUTUBE API CALLS ────────────────────────────────────────────────────────

/**
 * Auto-detect the YouTube channel ID by searching for the channel name.
 */
async function autoDetectChannelId() {
  console.log('[youtube-podcasts] Auto-detecting channel ID for:', CHANNEL_NAME);

  const url = `${YT_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(CHANNEL_NAME)}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[youtube-podcasts] Channel search failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.error('[youtube-podcasts] No channel found for:', CHANNEL_NAME);
      return null;
    }

    // Find the best match — look for exact name match first
    const exactMatch = data.items.find(
      item => item.snippet?.channelTitle?.toLowerCase() === CHANNEL_NAME.toLowerCase()
    );

    const channel = exactMatch || data.items[0];
    const channelId = channel.id?.channelId || channel.snippet?.channelId;

    console.log('[youtube-podcasts] Detected channel ID:', channelId, 'for channel:', channel.snippet?.channelTitle);
    return channelId;
  } catch (err) {
    console.error('[youtube-podcasts] Error auto-detecting channel:', err.message);
    return null;
  }
}

/**
 * Fetch the channel's upload playlist ID.
 */
async function getUploadsPlaylistId(channelId) {
  const url = `${YT_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[youtube-podcasts] Channel details fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.error('[youtube-podcasts] No channel data found for ID:', channelId);
      return null;
    }

    return data.items[0].contentDetails?.relatedPlaylists?.uploads || null;
  } catch (err) {
    console.error('[youtube-podcasts] Error fetching channel details:', err.message);
    return null;
  }
}

/**
 * Fetch the latest videos from the uploads playlist.
 * Returns an array of video IDs.
 */
async function getLatestVideoIds(playlistId, maxResults) {
  const url = `${YT_API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=${maxResults}&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[youtube-podcasts] Playlist items fetch failed:', response.status);
      return [];
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.error('[youtube-podcasts] No playlist items found');
      return [];
    }

    return data.items
      .map(item => item.contentDetails?.videoId)
      .filter(Boolean);
  } catch (err) {
    console.error('[youtube-podcasts] Error fetching playlist items:', err.message);
    return [];
  }
}

/**
 * Fetch detailed video information (snippet + contentDetails) for a list of video IDs.
 * YouTube API allows up to 50 IDs per request.
 */
async function getVideoDetails(videoIds) {
  if (videoIds.length === 0) return [];

  const idsParam = videoIds.join(',');
  const url = `${YT_API_BASE}/videos?part=snippet,contentDetails&id=${idsParam}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[youtube-podcasts] Video details fetch failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('[youtube-podcasts] Error fetching video details:', err.message);
    return [];
  }
}

/**
 * Main function to fetch podcasts from YouTube API.
 * Auto-detects channel, gets uploads, filters out shorts, returns formatted episodes.
 */
async function fetchFromYouTube() {
  // Step 1: Determine channel ID
  let channelId = YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    channelId = await autoDetectChannelId();
    if (!channelId) {
      console.error('[youtube-podcasts] Could not determine channel ID');
      return null;
    }
  }

  // Step 2: Get the uploads playlist ID
  const playlistId = await getUploadsPlaylistId(channelId);
  if (!playlistId) {
    console.error('[youtube-podcasts] Could not get uploads playlist ID');
    return null;
  }

  // Step 3: Get latest video IDs (fetch extra to account for shorts filtering)
  const fetchCount = Math.min(MAX_VIDEOS * 2, 50); // max 50 per request
  const videoIds = await getLatestVideoIds(playlistId, fetchCount);
  if (videoIds.length === 0) {
    console.error('[youtube-podcasts] No videos found');
    return null;
  }

  // Step 4: Get detailed video info (duration, etc.)
  const videos = await getVideoDetails(videoIds);
  if (videos.length === 0) {
    console.error('[youtube-podcasts] Could not fetch video details');
    return null;
  }

  // Step 5: Filter out shorts/streams and format
  const regularVideos = videos.filter(v => !isShort(v));
  const episodes = regularVideos.slice(0, MAX_VIDEOS).map(formatEpisode);

  console.log(`[youtube-podcasts] Fetched ${episodes.length} regular episodes (filtered from ${videos.length} videos)`);

  return episodes;
}

// ─── SANITY FALLBACK ──────────────────────────────────────────────────────────

/**
 * Fallback: Fetch podcast data from Sanity CMS using the Sanity CDN API.
 * This mirrors the existing frontend approach in main.js.
 */
async function fetchFromSanity() {
  console.log('[youtube-podcasts] Falling back to Sanity podcast data');

  const query = encodeURIComponent(
    `*[_type == "podcast"] | order(_createdAt desc) { title, youtubeLink }`
  );

  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-03-11/data/query/${SANITY_DATASET}?query=${query}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[youtube-podcasts] Sanity fetch failed:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const podcasts = data.result || [];

    // Format Sanity data into our podcast episode format
    return podcasts.map(p => {
      const youtubeLink = p.youtubeLink || '';
      let videoId = '';
      let embedUrl = '';

      if (youtubeLink.includes('watch?v=')) {
        videoId = youtubeLink.split('watch?v=')[1].split('&')[0];
      } else if (youtubeLink.includes('youtu.be/')) {
        videoId = youtubeLink.split('youtu.be/')[1].split('?')[0];
      } else if (youtubeLink.includes('embed/')) {
        videoId = youtubeLink.split('embed/')[1].split('?')[0];
      }

      embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

      return {
        title: p.title || 'Untitled Episode',
        videoId: videoId,
        description: p.description || '',
        thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : '',
        publishedAt: p.publishedAt || p._createdAt || new Date().toISOString(),
        youtubeLink: youtubeLink,
        embedUrl: embedUrl
      };
    });
  } catch (err) {
    console.error('[youtube-podcasts] Error fetching from Sanity:', err.message);
    return [];
  }
}

// ─── CACHE LOGIC ──────────────────────────────────────────────────────────────

/**
 * Check the Supabase live_cache for fresh podcast data.
 */
async function checkCache() {
  const supabase = supabaseClient();

  try {
    const { data: cached, error } = await supabase
      .from('live_cache')
      .select('cache_key, data, updated_at')
      .eq('cache_key', CACHE_KEY)
      .single();

    if (error) {
      // PGRST116 = no rows found — cache miss
      if (error.code === 'PGRST116') {
        return { hit: false, data: null };
      }
      console.error('[youtube-podcasts] Cache check error:', error.message);
      return { hit: false, data: null };
    }

    if (cached && cached.data) {
      const age = (Date.now() - new Date(cached.updated_at).getTime()) / 1000;
      if (age < CACHE_TTL_SECONDS) {
        console.log(`[youtube-podcasts] Cache HIT (age: ${Math.round(age)}s / ttl: ${CACHE_TTL_SECONDS}s)`);
        return { hit: true, data: cached.data };
      }
      console.log(`[youtube-podcasts] Cache STALE (age: ${Math.round(age)}s / ttl: ${CACHE_TTL_SECONDS}s)`);
      return { hit: false, data: cached.data, stale: true };
    }

    return { hit: false, data: null };
  } catch (err) {
    console.error('[youtube-podcasts] Cache check error:', err.message);
    return { hit: false, data: null };
  }
}

/**
 * Store podcast data in Supabase live_cache.
 */
async function writeCache(episodes) {
  const supabase = supabaseClient();

  try {
    const { error } = await supabase
      .from('live_cache')
      .upsert({
        cache_key: CACHE_KEY,
        source: 'youtube-api',
        data: episodes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });

    if (error) {
      console.error('[youtube-podcasts] Cache write error:', error.message);
    } else {
      console.log('[youtube-podcasts] Cache updated successfully');
    }
  } catch (err) {
    console.error('[youtube-podcasts] Cache write error:', err.message);
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { ok: true });
  }

  try {
    // Step 1: Check cache first
    const cacheResult = await checkCache();
    if (cacheResult.hit) {
      return createResponse(200, {
        podcasts: cacheResult.data,
        source: 'cache',
        updatedAt: new Date().toISOString()
      });
    }

    // Step 2: Check if YouTube API key is available
    if (!YOUTUBE_API_KEY) {
      console.log('[youtube-podcasts] No YouTube API key configured, falling back to Sanity');
      const sanityPodcasts = await fetchFromSanity();
      return createResponse(200, {
        podcasts: sanityPodcasts,
        source: 'sanity-fallback',
        updatedAt: new Date().toISOString()
      });
    }

    // Step 3: Try to fetch from YouTube API
    const episodes = await fetchFromYouTube();

    if (episodes && episodes.length > 0) {
      // Cache the fresh data
      await writeCache(episodes);

      return createResponse(200, {
        podcasts: episodes,
        source: 'youtube-api',
        updatedAt: new Date().toISOString()
      });
    }

    // Step 4: If YouTube fetch failed, try cache (even if stale) or Sanity fallback
    if (cacheResult.stale && cacheResult.data) {
      console.log('[youtube-podcasts] YouTube fetch failed, returning stale cache');
      return createResponse(200, {
        podcasts: cacheResult.data,
        source: 'cache-stale',
        updatedAt: new Date().toISOString()
      });
    }

    // Step 5: Last resort — Sanity fallback
    console.log('[youtube-podcasts] YouTube fetch failed, falling back to Sanity');
    const sanityPodcasts = await fetchFromSanity();
    return createResponse(200, {
      podcasts: sanityPodcasts,
      source: 'sanity-fallback',
      updatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[youtube-podcasts] Unhandled error:', err.message);

    // Last resort: try to return stale cache or Sanity data
    try {
      const cacheResult = await checkCache();
      if (cacheResult.data) {
        return createResponse(200, {
          podcasts: cacheResult.data,
          source: 'cache-error-fallback',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (_) {
      // ignore nested error
    }

    return createResponse(500, {
      error: 'Failed to fetch podcasts',
      message: err.message
    });
  }
};
