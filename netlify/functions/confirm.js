const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const token = event.queryStringParameters?.token;

  if (!token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h1>Error</h1><p>No confirmation token provided.</p>'
    };
  }

  try {
    // 1. Find the pending submission
    const { data: pending, error: findError } = await supabase
      .from('pending_submissions')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !pending) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: '<h1>Error</h1><p>Invalid or expired confirmation link.</p>'
      };
    }

    const prediction = pending.prediction;
    const champion = prediction?.knockoutWinners?.final || null;
    const verifiedAt = new Date().toISOString();

    // 2. Move to verified_submissions
    const { error: insertError } = await supabase
      .from('verified_submissions')
      .insert([{
        email: pending.email,
        name: pending.name,
        prediction: prediction,
        submitted_at: pending.submitted_at,
        verified_at: verifiedAt,
        champion: champion,
        score: null
      }]);

    if (insertError) {
      console.error('Database move error:', insertError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: '<h1>Error</h1><p>Verification failed. Please contact support.</p>'
      };
    }

    // 3. Delete from pending
    await supabase.from('pending_submissions').delete().eq('token', token);

    // 4. Send summary email (with error logging – non‑blocking)
    try {
      const emailHtml = buildSummaryEmail(pending.name, prediction);
      const msg = {
        to: pending.email,
        from: process.env.SENDER_EMAIL,
        subject: 'Your World Cup 2026 Prediction Summary',
        html: emailHtml,
        text: `Thank you for confirming your prediction. View the leaderboard at https://90minutesormore.com/leaderboard.html`
      };
      await sgMail.send(msg);
      console.log('✅ Summary email sent to:', pending.email);
    } catch (emailErr) {
      console.error('❌ SendGrid summary email error:', emailErr.response?.body || emailErr);
      // Do not fail the whole process – the user is already verified
    }

    // 5. Clean HTML response (no stray characters)
    const displayName = pending.name ? pending.name.trim() : 'football fan';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmed | 90 Minutes or More</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Poppins', sans-serif; }</style>
</head>
<body class="bg-gray-50">
  <div class="container mx-auto px-4 py-20 max-w-2xl text-center">
    <div class="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-600">
      <div class="text-6xl mb-4">✅</div>
      <h1 class="text-3xl font-bold mb-4">Prediction Verified!</h1>
      <p class="text-gray-600 mb-8 text-lg">Thank you, <span class="text-black font-bold">${escapeHtml(displayName)}</span>! Your entry is now on the leaderboard.</p>
      
      <div class="flex flex-col gap-3">
        <a href="/leaderboard.html" class="bg-red-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200">🏆 View Leaderboard</a>
        <div class="grid grid-cols-2 gap-3">
          <a href="/world-cup-predictor/index.html" class="bg-black text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-800 transition">Make Another</a>
          <a href="/" class="bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 transition">Back Home</a>
        </div>
      </div>
    </div>
    <p class="text-gray-400 text-sm mt-8">© 2024 90 Minutes or More · Toronto, ON</p>
  </div>
</body>
</html>`
    };

  } catch (err) {
    console.error('Confirm function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h1>Server error</h1><p>Please try again later.</p>'
    };
  }
};

// --------------------------------------------------------------
// Helper: Build summary email HTML
// --------------------------------------------------------------
function buildSummaryEmail(name, prediction) {
  const groupStage = prediction.groupStage || {};
  const thirdPlaceSelected = prediction.thirdPlaceSelected || [];
  const knockoutWinners = prediction.knockoutWinners || {};
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const flagMap = {
    'Mexico': '🇲🇽', 'Korea Republic': '🇰🇷', 'South Africa': '🇿🇦', 'Czechia': '🇨🇿',
    'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
    'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
    'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨',
    'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
    'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'IR Iran': '🇮🇷', 'New Zealand': '🇳🇿',
    'Spain': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
    'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
    'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
    'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦'
  };
  function flag(t) { return flagMap[t] || '🏁'; }

  let groupsHtml = '';
  for (const g of groups) {
    const grp = groupStage[g];
    if (grp && grp.positions) {
      groupsHtml += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Group ${g}</h3>
          <ul style="list-style: none; padding-left: 0;">
            <li>🥇 1st: ${flag(grp.positions['1st'])} ${grp.positions['1st'] || '—'}</li>
            <li>🥈 2nd: ${flag(grp.positions['2nd'])} ${grp.positions['2nd'] || '—'}</li>
            <li>🥉 3rd: ${flag(grp.positions['3rd'])} ${grp.positions['3rd'] || '—'}</li>
            <li>4th: ${flag(grp.positions['4th'])} ${grp.positions['4th'] || '—'}</li>
          </ul>
        </div>
      `;
    }
  }

  let thirdHtml = '<ul style="list-style: none; padding-left: 0;">';
  for (const group of thirdPlaceSelected) {
    const team = groupStage[group]?.positions['3rd'];
    if (team) thirdHtml += `<li>${flag(team)} ${team} (Group ${group})</li>`;
  }
  thirdHtml += '</ul>';

  let knockoutHtml = '';
  const stages = [
    { key: 'round32', label: 'Round of 32' },
    { key: 'round16', label: 'Round of 16' },
    { key: 'quarterfinals', label: 'Quarter-finals' },
    { key: 'semifinals', label: 'Semi-finals' }
  ];
  for (const stage of stages) {
    const winners = knockoutWinners[stage.key] || {};
    const matchIds = Object.keys(winners).sort((a, b) => a - b);
    if (matchIds.length) {
      knockoutHtml += `<h3 style="margin-top: 24px; margin-bottom: 8px; font-weight: bold;">${stage.label}</h3><ul style="list-style: none; padding-left: 0;">`;
      for (const id of matchIds) {
        knockoutHtml += `<li>Match ${id}: ${flag(winners[id])} ${winners[id]}</li>`;
      }
      knockoutHtml += `</ul>`;
    }
  }
  if (knockoutWinners.thirdPlace) {
    knockoutHtml += `<h3 style="margin-top: 24px; font-weight: bold;">Third-Place Match</h3><ul style="list-style: none; padding-left: 0;"><li>${flag(knockoutWinners.thirdPlace)} ${knockoutWinners.thirdPlace}</li></ul>`;
  }
  if (knockoutWinners.final) {
    knockoutHtml += `<h3 style="margin-top: 24px; font-weight: bold; color: #dc2626;">🏆 Champion</h3><ul style="list-style: none; padding-left: 0;"><li>${flag(knockoutWinners.final)} ${knockoutWinners.final}</li></ul>`;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 16px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">Your World Cup 2026 Prediction</h2>
      <p>Hello ${escapeHtml(name || 'football fan')},</p>
      <p>Thank you for confirming your prediction. Here is the summary of your picks:</p>
      ${groupsHtml}
      <h3 style="font-weight: bold; margin-top: 20px;">Third-Place Qualifiers (8 best)</h3>
      ${thirdHtml}
      <h3 style="font-weight: bold; margin-top: 20px;">Knockout Stage Winners</h3>
      ${knockoutHtml}
      <hr style="margin: 30px 0;">
      <p>You can view the live leaderboard at <a href="https://90minutesormore.com/leaderboard.html">90minutesormore.com/leaderboard.html</a></p>
      <p>— 90 Minutes or More Team</p>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }[tag] || tag));
}