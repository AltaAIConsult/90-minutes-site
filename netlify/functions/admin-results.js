// netlify/functions/admin-results.js
// POST-only endpoint for entering match results.
// Protected by x-admin-key header matching ADMIN_SECRET_KEY env var.
// Inserts/upserts into match_results, then triggers score recalculation.

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-key'
      },
      body: ''
    };
  }

  // ── POST only ───────────────────────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  // ── Admin auth check ────────────────────────────────────────────────────────
  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Unauthorized. Invalid or missing admin key.' })
    };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ── Parse request body ──────────────────────────────────────────────────
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body.' })
      };
    }

    const { match_id, home_score, away_score } = body;

    // ── Validate required fields ────────────────────────────────────────────
    if (match_id === undefined || match_id === null) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'match_id is required.' })
      };
    }

    if (home_score === undefined || home_score === null || away_score === undefined || away_score === null) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'home_score and away_score are required.' })
      };
    }

    const matchId = parseInt(match_id, 10);
    const homeScore = parseInt(home_score, 10);
    const awayScore = parseInt(away_score, 10);

    if (isNaN(matchId) || isNaN(homeScore) || isNaN(awayScore)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'match_id, home_score, and away_score must be numbers.' })
      };
    }

    if (homeScore < 0 || awayScore < 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Scores cannot be negative.' })
      };
    }

    // ── Upsert into match_results ───────────────────────────────────────────
    const { data: upsertData, error: upsertError } = await supabase
      .from('match_results')
      .upsert(
        {
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'match_id',
          ignoreDuplicates: false
        }
      );

    if (upsertError) {
      console.error('Error upserting match result:', upsertError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to save match result.' })
      };
    }

    // ── Recalculate all scores ──────────────────────────────────────────────
    let recalcResult = null;
    let recalcError = null;

    try {
      // Determine the base URL dynamically
      const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'http://localhost:8888';
      const recalcUrl = `${siteUrl}/.netlify/functions/update-scores`;

      const recalcResponse = await fetch(recalcUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (recalcResponse.ok) {
        recalcResult = await recalcResponse.json();
      } else {
        recalcError = `Recalculation returned status ${recalcResponse.status}`;
        const recalcBody = await recalcResponse.text().catch(() => '');
        console.error('Recalculation failed:', recalcBody);
      }
    } catch (fetchErr) {
      recalcError = fetchErr.message;
      console.error('Recalculation fetch error:', fetchErr.message);
    }

    // ── Return success ──────────────────────────────────────────────────────
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        match: {
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed'
        },
        recalculation: recalcResult || { error: recalcError || 'Recalculation not triggered' },
        message: 'Match result saved successfully.'
      })
    };

  } catch (error) {
    console.error('Admin-results error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
