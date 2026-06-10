// netlify/functions/match-schedule.js
// Serves the full World Cup 2026 match schedule with results

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Full group stage schedule (12 groups × 6 matches each = 72 group matches)
const GROUP_STAGE_FIXTURES = [
  // Group A
  { id: 1, round: 'group', group: 'A', home: 'Mexico', away: 'South Africa', date: '2026-06-11T16:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 2, round: 'group', group: 'A', home: 'Korea Republic', away: 'Czechia', date: '2026-06-12T13:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 3, round: 'group', group: 'A', home: 'Mexico', away: 'Korea Republic', date: '2026-06-16T20:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 4, round: 'group', group: 'A', home: 'South Africa', away: 'Czechia', date: '2026-06-16T16:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 5, round: 'group', group: 'A', home: 'Mexico', away: 'Czechia', date: '2026-06-21T20:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 6, round: 'group', group: 'A', home: 'South Africa', away: 'Korea Republic', date: '2026-06-21T16:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  // Group B
  { id: 7, round: 'group', group: 'B', home: 'Canada', away: 'Bosnia and Herzegovina', date: '2026-06-12T20:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 8, round: 'group', group: 'B', home: 'Qatar', away: 'Switzerland', date: '2026-06-12T16:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 9, round: 'group', group: 'B', home: 'Canada', away: 'Qatar', date: '2026-06-17T20:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 10, round: 'group', group: 'B', home: 'Bosnia and Herzegovina', away: 'Switzerland', date: '2026-06-17T16:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 11, round: 'group', group: 'B', home: 'Canada', away: 'Switzerland', date: '2026-06-22T20:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 12, round: 'group', group: 'B', home: 'Bosnia and Herzegovina', away: 'Qatar', date: '2026-06-22T16:00:00Z', venue: 'CenturyLink Field, Seattle' },
  // Group C
  { id: 13, round: 'group', group: 'C', home: 'Brazil', away: 'Morocco', date: '2026-06-13T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 14, round: 'group', group: 'C', home: 'Haiti', away: 'Scotland', date: '2026-06-13T16:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 15, round: 'group', group: 'C', home: 'Brazil', away: 'Haiti', date: '2026-06-17T13:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 16, round: 'group', group: 'C', home: 'Morocco', away: 'Scotland', date: '2026-06-18T16:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 17, round: 'group', group: 'C', home: 'Brazil', away: 'Scotland', date: '2026-06-23T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 18, round: 'group', group: 'C', home: 'Morocco', away: 'Haiti', date: '2026-06-23T16:00:00Z', venue: 'Estadio Universitario, Monterrey' },
  // Group D
  { id: 19, round: 'group', group: 'D', home: 'USA', away: 'Paraguay', date: '2026-06-13T13:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 20, round: 'group', group: 'D', home: 'Australia', away: 'Türkiye', date: '2026-06-14T16:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 21, round: 'group', group: 'D', home: 'USA', away: 'Australia', date: '2026-06-18T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 22, round: 'group', group: 'D', home: 'Paraguay', away: 'Türkiye', date: '2026-06-18T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 23, round: 'group', group: 'D', home: 'USA', away: 'Türkiye', date: '2026-06-24T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 24, round: 'group', group: 'D', home: 'Paraguay', away: 'Australia', date: '2026-06-24T16:00:00Z', venue: 'NRG Stadium, Houston' },
  // Group E
  { id: 25, round: 'group', group: 'E', home: 'Germany', away: 'Curaçao', date: '2026-06-14T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 26, round: 'group', group: 'E', home: 'Côte d\'Ivoire', away: 'Ecuador', date: '2026-06-14T13:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 27, round: 'group', group: 'E', home: 'Germany', away: 'Côte d\'Ivoire', date: '2026-06-19T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 28, round: 'group', group: 'E', home: 'Curaçao', away: 'Ecuador', date: '2026-06-19T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 29, round: 'group', group: 'E', home: 'Germany', away: 'Ecuador', date: '2026-06-25T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 30, round: 'group', group: 'E', home: 'Curaçao', away: 'Côte d\'Ivoire', date: '2026-06-25T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  // Group F
  { id: 31, round: 'group', group: 'F', home: 'Netherlands', away: 'Japan', date: '2026-06-15T20:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 32, round: 'group', group: 'F', home: 'Sweden', away: 'Tunisia', date: '2026-06-15T16:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 33, round: 'group', group: 'F', home: 'Netherlands', away: 'Sweden', date: '2026-06-19T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 34, round: 'group', group: 'F', home: 'Japan', away: 'Tunisia', date: '2026-06-20T16:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 35, round: 'group', group: 'F', home: 'Netherlands', away: 'Tunisia', date: '2026-06-25T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 36, round: 'group', group: 'F', home: 'Japan', away: 'Sweden', date: '2026-06-26T16:00:00Z', venue: 'Estadio Universitario, Monterrey' },
  // Group G
  { id: 37, round: 'group', group: 'G', home: 'Belgium', away: 'Egypt', date: '2026-06-15T13:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 38, round: 'group', group: 'G', home: 'IR Iran', away: 'New Zealand', date: '2026-06-16T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 39, round: 'group', group: 'G', home: 'Belgium', away: 'IR Iran', date: '2026-06-20T20:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 40, round: 'group', group: 'G', home: 'Egypt', away: 'New Zealand', date: '2026-06-20T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 41, round: 'group', group: 'G', home: 'Belgium', away: 'New Zealand', date: '2026-06-26T20:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 42, round: 'group', group: 'G', home: 'Egypt', away: 'IR Iran', date: '2026-06-26T13:00:00Z', venue: 'BC Place, Vancouver' },
  // Group H
  { id: 43, round: 'group', group: 'H', home: 'Spain', away: 'Cabo Verde', date: '2026-06-14T13:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 44, round: 'group', group: 'H', home: 'Saudi Arabia', away: 'Uruguay', date: '2026-06-15T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 45, round: 'group', group: 'H', home: 'Spain', away: 'Saudi Arabia', date: '2026-06-20T13:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 46, round: 'group', group: 'H', home: 'Cabo Verde', away: 'Uruguay', date: '2026-06-21T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 47, round: 'group', group: 'H', home: 'Spain', away: 'Uruguay', date: '2026-06-25T13:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 48, round: 'group', group: 'H', home: 'Cabo Verde', away: 'Saudi Arabia', date: '2026-06-27T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  // Group I
  { id: 49, round: 'group', group: 'I', home: 'France', away: 'Senegal', date: '2026-06-17T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 50, round: 'group', group: 'I', home: 'Iraq', away: 'Norway', date: '2026-06-18T13:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 51, round: 'group', group: 'I', home: 'France', away: 'Iraq', date: '2026-06-22T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 52, round: 'group', group: 'I', home: 'Senegal', away: 'Norway', date: '2026-06-22T13:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 53, round: 'group', group: 'I', home: 'France', away: 'Norway', date: '2026-06-27T20:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 54, round: 'group', group: 'I', home: 'Senegal', away: 'Iraq', date: '2026-06-27T13:00:00Z', venue: 'Gillette Stadium, Boston' },
  // Group J
  { id: 55, round: 'group', group: 'J', home: 'Argentina', away: 'Algeria', date: '2026-06-16T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 56, round: 'group', group: 'J', home: 'Austria', away: 'Jordan', date: '2026-06-17T13:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 57, round: 'group', group: 'J', home: 'Argentina', away: 'Austria', date: '2026-06-21T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 58, round: 'group', group: 'J', home: 'Algeria', away: 'Jordan', date: '2026-06-21T13:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 59, round: 'group', group: 'J', home: 'Argentina', away: 'Jordan', date: '2026-06-26T13:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 60, round: 'group', group: 'J', home: 'Algeria', away: 'Austria', date: '2026-06-27T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  // Group K
  { id: 61, round: 'group', group: 'K', home: 'Portugal', away: 'Congo DR', date: '2026-06-13T13:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 62, round: 'group', group: 'K', home: 'Uzbekistan', away: 'Colombia', date: '2026-06-14T20:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 63, round: 'group', group: 'K', home: 'Portugal', away: 'Uzbekistan', date: '2026-06-18T20:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 64, round: 'group', group: 'K', home: 'Congo DR', away: 'Colombia', date: '2026-06-19T13:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 65, round: 'group', group: 'K', home: 'Portugal', away: 'Colombia', date: '2026-06-23T16:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 66, round: 'group', group: 'K', home: 'Congo DR', away: 'Uzbekistan', date: '2026-06-24T13:00:00Z', venue: 'BMO Field, Toronto' },
  // Group L
  { id: 67, round: 'group', group: 'L', home: 'England', away: 'Croatia', date: '2026-06-11T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 68, round: 'group', group: 'L', home: 'Ghana', away: 'Panama', date: '2026-06-12T16:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 69, round: 'group', group: 'L', home: 'England', away: 'Ghana', date: '2026-06-16T16:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 70, round: 'group', group: 'L', home: 'Croatia', away: 'Panama', date: '2026-06-17T16:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 71, round: 'group', group: 'L', home: 'England', away: 'Panama', date: '2026-06-22T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 72, round: 'group', group: 'L', home: 'Croatia', away: 'Ghana', date: '2026-06-23T13:00:00Z', venue: 'Lumen Field, Seattle' }
];

const KNOCKOUT_FIXTURES = [
  // Round of 32
  { id: 73, round: 'round32', home: 'A2', away: 'B2', date: '2026-06-28T16:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 74, round: 'round32', home: 'E1', away: '3rd(ABCD F)', date: '2026-06-29T16:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 75, round: 'round32', home: 'F1', away: 'C2', date: '2026-06-29T20:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 76, round: 'round32', home: 'C1', away: 'F2', date: '2026-06-29T13:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 77, round: 'round32', home: 'I1', away: '3rd(CDFGH)', date: '2026-06-30T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 78, round: 'round32', home: 'E2', away: 'I2', date: '2026-06-30T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 79, round: 'round32', home: 'A1', away: '3rd(CEFHI)', date: '2026-06-30T13:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 80, round: 'round32', home: 'L1', away: '3rd(EHIJK)', date: '2026-07-01T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 81, round: 'round32', home: 'D1', away: '3rd(BEFIJ)', date: '2026-07-01T20:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 82, round: 'round32', home: 'G1', away: '3rd(AEHIJ)', date: '2026-07-01T13:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 83, round: 'round32', home: 'K2', away: 'L2', date: '2026-07-02T20:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 84, round: 'round32', home: 'H1', away: 'J2', date: '2026-07-02T16:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 85, round: 'round32', home: 'B1', away: '3rd(EFGIJ)', date: '2026-07-02T13:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 86, round: 'round32', home: 'J1', away: 'H2', date: '2026-07-03T20:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 87, round: 'round32', home: 'K1', away: '3rd(DEIJL)', date: '2026-07-03T16:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 88, round: 'round32', home: 'D2', away: 'G2', date: '2026-07-03T13:00:00Z', venue: 'AT&T Stadium, Dallas' },
  // Round of 16
  { id: 89, round: 'round16', homeMatch: 74, awayMatch: 77, date: '2026-07-04T16:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 90, round: 'round16', homeMatch: 73, awayMatch: 75, date: '2026-07-04T20:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 91, round: 'round16', homeMatch: 76, awayMatch: 78, date: '2026-07-05T16:00:00Z', venue: 'MetLife Stadium, NJ/NY' },
  { id: 92, round: 'round16', homeMatch: 79, awayMatch: 80, date: '2026-07-05T20:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 93, round: 'round16', homeMatch: 83, awayMatch: 84, date: '2026-07-06T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 94, round: 'round16', homeMatch: 81, awayMatch: 82, date: '2026-07-06T16:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 95, round: 'round16', homeMatch: 86, awayMatch: 88, date: '2026-07-07T20:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 96, round: 'round16', homeMatch: 85, awayMatch: 87, date: '2026-07-07T16:00:00Z', venue: 'BC Place, Vancouver' },
  // Quarter-finals
  { id: 97, round: 'quarter', homeMatch: 89, awayMatch: 90, date: '2026-07-09T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 98, round: 'quarter', homeMatch: 93, awayMatch: 94, date: '2026-07-10T20:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 99, round: 'quarter', homeMatch: 91, awayMatch: 92, date: '2026-07-11T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 100, round: 'quarter', homeMatch: 95, awayMatch: 96, date: '2026-07-11T20:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  // Semi-finals
  { id: 101, round: 'semi', homeMatch: 97, awayMatch: 98, date: '2026-07-14T20:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 102, round: 'semi', homeMatch: 99, awayMatch: 100, date: '2026-07-15T20:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  // Third Place
  { id: 103, round: 'thirdPlace', homeMatch: 101, awayMatch: 102, date: '2026-07-18T16:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  // Final
  { id: 104, round: 'final', homeMatch: 101, awayMatch: 102, date: '2026-07-19T15:00:00Z', venue: 'MetLife Stadium, NJ/NY' }
];

exports.handler = async (event) => {
  const path = event.path;
  const isKnockout = path.includes('/knockout');
  const isToday = event.queryStringParameters?.today === 'true';
  
  try {
    // Fetch live results from Supabase
    const { data: results } = await supabase
      .from('match_results')
      .select('match_id, home_score, away_score, status')
      .in('match_id', isKnockout 
        ? KNOCKOUT_FIXTURES.map(m => m.id) 
        : GROUP_STAGE_FIXTURES.map(m => m.id)
      );
    
    const resultMap = {};
    if (results) {
      results.forEach(r => { resultMap[r.match_id] = r; });
    }
    
    let fixtures = isKnockout ? KNOCKOUT_FIXTURES : GROUP_STAGE_FIXTURES;
    
    // Merge results into fixtures
    const merged = fixtures.map(f => ({
      ...f,
      homeScore: resultMap[f.id]?.home_score ?? null,
      awayScore: resultMap[f.id]?.away_score ?? null,
      status: resultMap[f.id]?.status || 'scheduled'
    }));
    
    // Filter to today if requested
    let responseData = merged;
    if (isToday) {
      const todayStr = new Date().toISOString().split('T')[0];
      responseData = merged.filter(m => m.date && m.date.startsWith(todayStr));
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      },
      body: JSON.stringify({ 
        fixtures: responseData,
        updatedAt: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Match schedule error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load schedule' })
    };
  }
};
