// netlify/functions/update-scores.js
// Recalculates scores for ALL verified submissions by comparing predictions to match results

const { createClient } = require('@supabase/supabase-js');

// ─── FIXTURE DATA ────────────────────────────────────────────────────────────

const GROUP_STAGE_FIXTURES = [
  // Group A (1-6)
  { id: 1, group: 'A', home: 'Mexico', away: 'South Africa' },
  { id: 2, group: 'A', home: 'Korea Republic', away: 'Czechia' },
  { id: 3, group: 'A', home: 'Mexico', away: 'Korea Republic' },
  { id: 4, group: 'A', home: 'South Africa', away: 'Czechia' },
  { id: 5, group: 'A', home: 'Mexico', away: 'Czechia' },
  { id: 6, group: 'A', home: 'South Africa', away: 'Korea Republic' },
  // Group B (7-12)
  { id: 7, group: 'B', home: 'Canada', away: 'Bosnia and Herzegovina' },
  { id: 8, group: 'B', home: 'Qatar', away: 'Switzerland' },
  { id: 9, group: 'B', home: 'Canada', away: 'Qatar' },
  { id: 10, group: 'B', home: 'Bosnia and Herzegovina', away: 'Switzerland' },
  { id: 11, group: 'B', home: 'Canada', away: 'Switzerland' },
  { id: 12, group: 'B', home: 'Bosnia and Herzegovina', away: 'Qatar' },
  // Group C (13-18)
  { id: 13, group: 'C', home: 'Brazil', away: 'Morocco' },
  { id: 14, group: 'C', home: 'Haiti', away: 'Scotland' },
  { id: 15, group: 'C', home: 'Brazil', away: 'Haiti' },
  { id: 16, group: 'C', home: 'Morocco', away: 'Scotland' },
  { id: 17, group: 'C', home: 'Brazil', away: 'Scotland' },
  { id: 18, group: 'C', home: 'Morocco', away: 'Haiti' },
  // Group D (19-24)
  { id: 19, group: 'D', home: 'USA', away: 'Paraguay' },
  { id: 20, group: 'D', home: 'Australia', away: 'Türkiye' },
  { id: 21, group: 'D', home: 'USA', away: 'Australia' },
  { id: 22, group: 'D', home: 'Paraguay', away: 'Türkiye' },
  { id: 23, group: 'D', home: 'USA', away: 'Türkiye' },
  { id: 24, group: 'D', home: 'Paraguay', away: 'Australia' },
  // Group E (25-30)
  { id: 25, group: 'E', home: 'Germany', away: 'Curaçao' },
  { id: 26, group: 'E', home: "Côte d'Ivoire", away: 'Ecuador' },
  { id: 27, group: 'E', home: 'Germany', away: "Côte d'Ivoire" },
  { id: 28, group: 'E', home: 'Curaçao', away: 'Ecuador' },
  { id: 29, group: 'E', home: 'Germany', away: 'Ecuador' },
  { id: 30, group: 'E', home: 'Curaçao', away: "Côte d'Ivoire" },
  // Group F (31-36)
  { id: 31, group: 'F', home: 'Netherlands', away: 'Japan' },
  { id: 32, group: 'F', home: 'Sweden', away: 'Tunisia' },
  { id: 33, group: 'F', home: 'Netherlands', away: 'Sweden' },
  { id: 34, group: 'F', home: 'Japan', away: 'Tunisia' },
  { id: 35, group: 'F', home: 'Netherlands', away: 'Tunisia' },
  { id: 36, group: 'F', home: 'Japan', away: 'Sweden' },
  // Group G (37-42)
  { id: 37, group: 'G', home: 'Belgium', away: 'Egypt' },
  { id: 38, group: 'G', home: 'IR Iran', away: 'New Zealand' },
  { id: 39, group: 'G', home: 'Belgium', away: 'IR Iran' },
  { id: 40, group: 'G', home: 'Egypt', away: 'New Zealand' },
  { id: 41, group: 'G', home: 'Belgium', away: 'New Zealand' },
  { id: 42, group: 'G', home: 'Egypt', away: 'IR Iran' },
  // Group H (43-48)
  { id: 43, group: 'H', home: 'Spain', away: 'Cabo Verde' },
  { id: 44, group: 'H', home: 'Saudi Arabia', away: 'Uruguay' },
  { id: 45, group: 'H', home: 'Spain', away: 'Saudi Arabia' },
  { id: 46, group: 'H', home: 'Cabo Verde', away: 'Uruguay' },
  { id: 47, group: 'H', home: 'Spain', away: 'Uruguay' },
  { id: 48, group: 'H', home: 'Cabo Verde', away: 'Saudi Arabia' },
  // Group I (49-54)
  { id: 49, group: 'I', home: 'France', away: 'Senegal' },
  { id: 50, group: 'I', home: 'Iraq', away: 'Norway' },
  { id: 51, group: 'I', home: 'France', away: 'Iraq' },
  { id: 52, group: 'I', home: 'Senegal', away: 'Norway' },
  { id: 53, group: 'I', home: 'France', away: 'Norway' },
  { id: 54, group: 'I', home: 'Senegal', away: 'Iraq' },
  // Group J (55-60)
  { id: 55, group: 'J', home: 'Argentina', away: 'Algeria' },
  { id: 56, group: 'J', home: 'Austria', away: 'Jordan' },
  { id: 57, group: 'J', home: 'Argentina', away: 'Austria' },
  { id: 58, group: 'J', home: 'Algeria', away: 'Jordan' },
  { id: 59, group: 'J', home: 'Argentina', away: 'Jordan' },
  { id: 60, group: 'J', home: 'Algeria', away: 'Austria' },
  // Group K (61-66)
  { id: 61, group: 'K', home: 'Portugal', away: 'Congo DR' },
  { id: 62, group: 'K', home: 'Uzbekistan', away: 'Colombia' },
  { id: 63, group: 'K', home: 'Portugal', away: 'Uzbekistan' },
  { id: 64, group: 'K', home: 'Congo DR', away: 'Colombia' },
  { id: 65, group: 'K', home: 'Portugal', away: 'Colombia' },
  { id: 66, group: 'K', home: 'Congo DR', away: 'Uzbekistan' },
  // Group L (67-72)
  { id: 67, group: 'L', home: 'England', away: 'Croatia' },
  { id: 68, group: 'L', home: 'Ghana', away: 'Panama' },
  { id: 69, group: 'L', home: 'England', away: 'Ghana' },
  { id: 70, group: 'L', home: 'Croatia', away: 'Panama' },
  { id: 71, group: 'L', home: 'England', away: 'Panama' },
  { id: 72, group: 'L', home: 'Croatia', away: 'Ghana' }
];

const KNOCKOUT_FIXTURES = [
  // Round of 32 (73-88)
  { id: 73, round: 'round32', homeSlot: 'A2', awaySlot: 'B2', nextMatch: 90, nextPosition: 'away' },
  { id: 74, round: 'round32', homeSlot: 'E1', awaySlot: '3rd(ABCD F)', nextMatch: 89, nextPosition: 'home' },
  { id: 75, round: 'round32', homeSlot: 'F1', awaySlot: 'C2', nextMatch: 90, nextPosition: 'home' },
  { id: 76, round: 'round32', homeSlot: 'C1', awaySlot: 'F2', nextMatch: 91, nextPosition: 'home' },
  { id: 77, round: 'round32', homeSlot: 'I1', awaySlot: '3rd(CDFGH)', nextMatch: 89, nextPosition: 'away' },
  { id: 78, round: 'round32', homeSlot: 'E2', awaySlot: 'I2', nextMatch: 91, nextPosition: 'away' },
  { id: 79, round: 'round32', homeSlot: 'A1', awaySlot: '3rd(CEFHI)', nextMatch: 92, nextPosition: 'home' },
  { id: 80, round: 'round32', homeSlot: 'L1', awaySlot: '3rd(EHIJK)', nextMatch: 92, nextPosition: 'away' },
  { id: 81, round: 'round32', homeSlot: 'D1', awaySlot: '3rd(BEFIJ)', nextMatch: 94, nextPosition: 'home' },
  { id: 82, round: 'round32', homeSlot: 'G1', awaySlot: '3rd(AEHIJ)', nextMatch: 94, nextPosition: 'away' },
  { id: 83, round: 'round32', homeSlot: 'K2', awaySlot: 'L2', nextMatch: 93, nextPosition: 'home' },
  { id: 84, round: 'round32', homeSlot: 'H1', awaySlot: 'J2', nextMatch: 93, nextPosition: 'away' },
  { id: 85, round: 'round32', homeSlot: 'B1', awaySlot: '3rd(EFGIJ)', nextMatch: 96, nextPosition: 'home' },
  { id: 86, round: 'round32', homeSlot: 'J1', awaySlot: 'H2', nextMatch: 95, nextPosition: 'home' },
  { id: 87, round: 'round32', homeSlot: 'K1', awaySlot: '3rd(DEIJL)', nextMatch: 96, nextPosition: 'away' },
  { id: 88, round: 'round32', homeSlot: 'D2', awaySlot: 'G2', nextMatch: 95, nextPosition: 'away' },
  // Round of 16 (89-96)
  { id: 89, round: 'round16', homeMatch: 74, awayMatch: 77, nextMatch: 97, nextPosition: 'home' },
  { id: 90, round: 'round16', homeMatch: 73, awayMatch: 75, nextMatch: 97, nextPosition: 'away' },
  { id: 91, round: 'round16', homeMatch: 76, awayMatch: 78, nextMatch: 99, nextPosition: 'home' },
  { id: 92, round: 'round16', homeMatch: 79, awayMatch: 80, nextMatch: 99, nextPosition: 'away' },
  { id: 93, round: 'round16', homeMatch: 83, awayMatch: 84, nextMatch: 98, nextPosition: 'home' },
  { id: 94, round: 'round16', homeMatch: 81, awayMatch: 82, nextMatch: 98, nextPosition: 'away' },
  { id: 95, round: 'round16', homeMatch: 86, awayMatch: 88, nextMatch: 100, nextPosition: 'home' },
  { id: 96, round: 'round16', homeMatch: 85, awayMatch: 87, nextMatch: 100, nextPosition: 'away' },
  // Quarter-finals (97-100)
  { id: 97, round: 'quarter', homeMatch: 89, awayMatch: 90, nextMatch: 101, nextPosition: 'home' },
  { id: 98, round: 'quarter', homeMatch: 93, awayMatch: 94, nextMatch: 101, nextPosition: 'away' },
  { id: 99, round: 'quarter', homeMatch: 91, awayMatch: 92, nextMatch: 102, nextPosition: 'home' },
  { id: 100, round: 'quarter', homeMatch: 95, awayMatch: 96, nextMatch: 102, nextPosition: 'away' },
  // Semi-finals (101-102)
  { id: 101, round: 'semi', homeMatch: 97, awayMatch: 98, nextMatch: 103, nextPosition: 'home' },
  { id: 102, round: 'semi', homeMatch: 99, awayMatch: 100, nextMatch: 103, nextPosition: 'away' },
  // Third Place (103)
  { id: 103, round: 'thirdPlace', homeMatch: 101, awayMatch: 102 },
  // Final (104)
  { id: 104, round: 'final', homeMatch: 101, awayMatch: 102 }
];

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getGroupTeams(groupLetter) {
  const groupFixtures = GROUP_STAGE_FIXTURES.filter(f => f.group === groupLetter);
  const teams = new Set();
  groupFixtures.forEach(f => { teams.add(f.home); teams.add(f.away); });
  return Array.from(teams);
}

function getAllGroupFixturesForGroup(groupLetter) {
  return GROUP_STAGE_FIXTURES.filter(f => f.group === groupLetter);
}

/**
 * Compute actual group standings from match results
 * Returns: { 1st: 'Team', 2nd: 'Team', 3rd: 'Team', 4th: 'Team' }
 */
function computeGroupStandings(groupLetter, resultsMap) {
  const teams = getGroupTeams(groupLetter);
  const fixtures = getAllGroupFixturesForGroup(groupLetter);

  // Initialize team stats
  const stats = {};
  teams.forEach(t => {
    stats[t] = { pts: 0, gf: 0, ga: 0 };
  });

  // Apply results
  fixtures.forEach(f => {
    const result = resultsMap[f.id];
    if (!result || result.status !== 'completed') return;
    const homeScore = result.home_score;
    const awayScore = result.away_score;
    if (homeScore === null || awayScore === null) return;

    stats[f.home].gf += homeScore;
    stats[f.home].ga += awayScore;
    stats[f.away].gf += awayScore;
    stats[f.away].ga += homeScore;

    if (homeScore > awayScore) {
      stats[f.home].pts += 3;
    } else if (awayScore > homeScore) {
      stats[f.away].pts += 3;
    } else {
      stats[f.home].pts += 1;
      stats[f.away].pts += 1;
    }
  });

  // Sort: points desc, goal difference desc, goals for desc
  const sorted = teams.sort((a, b) => {
    if (stats[b].pts !== stats[a].pts) return stats[b].pts - stats[a].pts;
    const gdA = stats[a].gf - stats[a].ga;
    const gdB = stats[b].gf - stats[b].ga;
    if (gdB !== gdA) return gdB - gdA;
    return stats[b].gf - stats[a].gf;
  });

  return {
    '1st': sorted[0],
    '2nd': sorted[1],
    '3rd': sorted[2],
    '4th': sorted[3]
  };
}

/**
 * Determine which 8 third-place teams advance
 * Returns array of group letters (e.g., ['A', 'C', 'E', ...])
 */
function computeBestThirdPlaceTeams(resultsMap) {
  const thirdPlaceData = [];

  GROUP_LETTERS.forEach(letter => {
    const standings = computeGroupStandings(letter, resultsMap);
    const thirdTeam = standings['3rd'];
    if (!thirdTeam) return;

    const fixtures = getAllGroupFixturesForGroup(letter);
    const stats = { pts: 0, gf: 0, ga: 0 };
    fixtures.forEach(f => {
      const result = resultsMap[f.id];
      if (!result || result.status !== 'completed') return;
      const homeScore = result.home_score;
      const awayScore = result.away_score;
      if (homeScore === null || awayScore === null) return;

      let teamScore = 0, teamConcede = 0;
      if (f.home === thirdTeam) { teamScore = homeScore; teamConcede = awayScore; }
      else if (f.away === thirdTeam) { teamScore = awayScore; teamConcede = homeScore; }
      else return;

      stats.gf += teamScore;
      stats.ga += teamConcede;
      if (teamScore > teamConcede) stats.pts += 3;
      else if (teamScore === teamConcede) stats.pts += 1;
    });

    thirdPlaceData.push({
      group: letter,
      team: thirdTeam,
      pts: stats.pts,
      gd: stats.gf - stats.ga,
      gf: stats.gf
    });
  });

  // Sort by pts desc, GD desc, GF desc
  thirdPlaceData.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  return thirdPlaceData.slice(0, 8).map(d => d.group);
}

/**
 * Resolve a round32 slot to an actual team name
 * Slots like 'A2' -> 2nd place of Group A
 * '3rd(ABCD F)' -> the third-place team that advanced from among those groups
 */
function resolveSlot(slot, groupStandings, bestThirdPlaceGroups) {
  if (slot.length === 2) {
    const group = slot[0];
    const pos = slot[1] === '1' ? '1st' : '2nd';
    return groupStandings[group] ? groupStandings[group][pos] : null;
  }
  // 3rd place slot: e.g. '3rd(ABCD F)'
  const match = slot.match(/3rd\(([^)]+)\)/);
  if (match) {
    const allowedGroups = match[1].split(/\/| /).filter(Boolean);
    for (const letter of bestThirdPlaceGroups) {
      if (allowedGroups.includes(letter)) {
        return groupStandings[letter] ? groupStandings[letter]['3rd'] : null;
      }
    }
  }
  return null;
}

/**
 * Compute actual knockout winners given group standings and match results
 * Returns a map: matchId -> winningTeam
 */
function computeKnockoutWinners(groupStandings, bestThirdPlaceGroups, resultsMap) {
  // First compute round32 winners
  const winners = {};

  KNOCKOUT_FIXTURES.forEach(f => {
    if (f.round === 'round32') {
      const homeTeam = resolveSlot(f.homeSlot, groupStandings, bestThirdPlaceGroups);
      const awayTeam = resolveSlot(f.awaySlot, groupStandings, bestThirdPlaceGroups);
      if (!homeTeam || !awayTeam) return;

      const result = resultsMap[f.id];
      if (!result || result.status !== 'completed') return;
      const homeScore = result.home_score;
      const awayScore = result.away_score;
      if (homeScore === null || awayScore === null) return;

      winners[f.id] = homeScore > awayScore ? homeTeam : awayTeam;
    }
  });

  // Now compute later rounds
  const laterFixtures = KNOCKOUT_FIXTURES.filter(f => f.round !== 'round32');
  laterFixtures.forEach(f => {
    const homeWinner = winners[f.homeMatch];
    const awayWinner = winners[f.awayMatch];
    if (!homeWinner || !awayWinner) return;

    const result = resultsMap[f.id];
    if (!result || result.status !== 'completed') return;
    const homeScore = result.home_score;
    const awayScore = result.away_score;
    if (homeScore === null || awayScore === null) return;

    winners[f.id] = homeScore > awayScore ? homeWinner : awayWinner;
  });

  return winners;
}

/**
 * Calculate score for a single submission
 */
function calculateScore(prediction, groupStandings, bestThirdPlaceGroups, knockoutWinners) {
  if (!prediction) return 0;
  let score = 0;

  const predGroups = prediction.groupStage || {};
  const predThirdPlace = prediction.thirdPlaceSelected || [];
  const predKnockout = prediction.knockoutWinners || {};

  // ── Group stage scoring ──
  // 3 pts for exact position, 1 pt for correct advancement (top 2)
  GROUP_LETTERS.forEach(letter => {
    const actual = groupStandings[letter];
    const predicted = predGroups[letter];
    if (!actual || !predicted || !predicted.positions) return;

    const positions = ['1st', '2nd', '3rd', '4th'];
    positions.forEach(pos => {
      const predTeam = predicted.positions[pos];
      if (!predTeam) return;

      // Check exact position (3 pts)
      if (actual[pos] === predTeam) {
        score += 3;
      }

      // Check correct advancement (1 pt for top 2)
      if (pos === '1st' || pos === '2nd') {
        if (actual['1st'] === predTeam || actual['2nd'] === predTeam) {
          score += 1;
        }
      }
    });
  });

  // ── Third-place qualifiers (2 pts per correct team) ──
  predThirdPlace.forEach(groupLetter => {
    if (bestThirdPlaceGroups.includes(groupLetter)) {
      score += 2;
    }
  });

  // ── Knockout scoring (5 pts per correct winner) ──
  const knockoutStages = ['round32', 'round16', 'quarterFinals', 'semiFinals'];
  knockoutStages.forEach(stage => {
    const stagePicks = predKnockout[stage] || {};
    Object.entries(stagePicks).forEach(([matchIdStr, pickedTeam]) => {
      const matchId = parseInt(matchIdStr, 10);
      const actualWinner = knockoutWinners[matchId];
      if (actualWinner && actualWinner === pickedTeam) {
        score += 5;
      }
    });
  });

  // Check final match (ID 104) - winner is predKnockout.final
  const finalWinner = knockoutWinners[104];
  if (finalWinner && predKnockout.final === finalWinner) {
    score += 5;

    // Champion bonus: 15 pts
    score += 15;
  }

  // Note: third-place match (ID 103) is not user-selectable in the UI,
  // so no scoring is applied for it.

  return score;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Fetch all match results
    const { data: matchResults, error: resultsError } = await supabase
      .from('match_results')
      .select('match_id, home_score, away_score, status');

    if (resultsError) {
      console.error('Error fetching match results:', resultsError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to fetch match results' })
      };
    }

    // Index results by match_id
    const resultsMap = {};
    (matchResults || []).forEach(r => {
      resultsMap[r.match_id] = r;
    });

    // 2. Compute actual standings
    const groupStandings = {};
    GROUP_LETTERS.forEach(letter => {
      groupStandings[letter] = computeGroupStandings(letter, resultsMap);
    });

    // 3. Compute best 8 third-place teams
    const bestThirdPlaceGroups = computeBestThirdPlaceTeams(resultsMap);

    // 4. Compute knockout winners
    const knockoutWinners = computeKnockoutWinners(groupStandings, bestThirdPlaceGroups, resultsMap);

    // 5. Fetch all verified submissions
    const { data: submissions, error: subsError } = await supabase
      .from('verified_submissions')
      .select('email, name, champion, prediction, score');

    if (subsError) {
      console.error('Error fetching submissions:', subsError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to fetch submissions' })
      };
    }

    // 6. Calculate and update scores
    let updated = 0;
    const scores = [];

    for (const sub of (submissions || [])) {
      const newScore = calculateScore(sub.prediction, groupStandings, bestThirdPlaceGroups, knockoutWinners);

      const { error: updateError } = await supabase
        .from('verified_submissions')
        .update({ score: newScore })
        .eq('email', sub.email);

      if (updateError) {
        console.error(`Error updating score for ${sub.email}:`, updateError);
        continue;
      }

      updated++;
      scores.push({
        name: sub.name || 'Anonymous',
        score: newScore,
        champion: sub.champion || null,
        email: sub.email
      });
    }

    // Sort scores descending
    scores.sort((a, b) => b.score - a.score);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        updated: updated,
        scores: scores,
        metadata: {
          groupsComputed: GROUP_LETTERS.length,
          bestThirdPlaceTeams: bestThirdPlaceGroups,
          knockoutMatchesWithResults: Object.keys(knockoutWinners).length
        }
      })
    };

  } catch (error) {
    console.error('Update-scores error:', error);
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
