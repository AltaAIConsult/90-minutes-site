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
      body: '<h1>Error</h1><p>No confirmation token provided.</p>'
    };
  }

  try {
    // 1. Find pending submission
    const { data: pending, error: findError } = await supabase
      .from('pending_submissions')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !pending) {
      return {
        statusCode: 404,
        body: '<h1>Error</h1><p>Invalid or expired confirmation link.</p>'
      };
    }

    // 2. Extract champion and prediction
    const prediction = pending.prediction;
    let champion = null;
    if (prediction && prediction.knockoutWinners) {
      champion = prediction.knockoutWinners.final;
    }

    // 3. Move to verified
    const { error: insertError } = await supabase
      .from('verified_submissions')
      .insert([{
        email: pending.email,
        name: pending.name,
        prediction: prediction,
        submitted_at: pending.submitted_at,
        verified_at: new Date().toISOString(),
        champion: champion,
        score: null
      }]);

    if (insertError) {
      console.error('Insert error:', insertError);
      return {
        statusCode: 500,
        body: '<h1>Error</h1><p>Could not verify your submission. Please contact support.</p>'
      };
    }

    // 4. Delete from pending
    await supabase.from('pending_submissions').delete().eq('token', token);

    // 5. Send summary email
    const emailHtml = buildSummaryEmail(pending.name, prediction);
    const msg = {
      to: pending.email,
      from: process.env.SENDER_EMAIL,
      subject: 'Your World Cup 2026 Prediction Summary',
      html: emailHtml,
      text: `Thank you for confirming your prediction. You can view the leaderboard at https://90minutesormore.com/leaderboard.html`
    };
    await sgMail.send(msg);

    // 6. Return confirmation page
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Prediction Confirmed | 90 Minutes or More</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>body { font-family: 'Poppins', sans-serif; }</style>
    </head>
    <body class="bg-gray-50">
      <div class="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-6xl mb-4">✅</div>
          <h1 class="text-3xl font-bold mb-2">Prediction Confirmed!</h1>
          <p class="text-gray-600 mb-6">Thank you, ${pending.name || 'football fan'}! Your World Cup 2026 prediction has been verified.</p>
          <div class="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
            You are now on the leaderboard. A summary of your prediction has been sent to your email.
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/leaderboard.html" class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition">View Leaderboard</a>
            <a href="/world-cup-predictor/index.html" class="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">Make Another Prediction</a>
            <a href="/index.html" class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition">Back to Home</a>
          </div>
        </div>
        <p class="text-gray-400 text-sm mt-8">© 2024 90 Minutes or More · Toronto, ON</p>
      </div>
    </body>
    </html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };

  } catch (err) {
    console.error('Confirm function error:', err);
    return {
      statusCode: 500,
      body: '<h1>Server error</h1><p>Please try again later.</p>'
    };
  }
};

// Helper: Build summary email HTML
function buildSummaryEmail(name, prediction) {
  const groupStage = prediction.groupStage || {};
  const thirdPlaceSelected = prediction.thirdPlaceSelected || [];
  const knockoutWinners = prediction.knockoutWinners || {};
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Flag map (same as predictor – keep it minimal)
  const flagMap = {
    'Mexico': '🇲🇽', 'Korea Republic': '🇰🇷', 'South Africa': '🇿🇦', 'Czechia': '🇨🇿',
    'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
    'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
    'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Cote d\'Ivoire': '🇨🇮', 'Ecuador': '🇪🇨',
    'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
    'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'IR Iran': '🇮🇷', 'New Zealand': '🇳🇿',
    'Spain': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
    'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
    'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
    'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦'
  };
  function flag(team) { return flagMap[team] || '🏁'; }

  // Group stage HTML
  let groupsHtml = '';
  for (const g of groups) {
    const grp = groupStage[g];
    if (grp && grp.positions) {
      groupsHtml += `
        <div style="margin-bottom: 20px;">
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

  // Third-place qualifiers
  let thirdHtml = '<ul style="list-style: none; padding-left: 0;">';
  for (const group of thirdPlaceSelected) {
    const team = groupStage[group]?.positions['3rd'];
    if (team) {
      thirdHtml += `<li>${flag(team)} ${team} (Group ${group})</li>`;
    }
  }
  thirdHtml += '</ul>';

  // Knockout winners (simplified: just list matches and winners)
  let knockoutHtml = '';
  const stages = [
    { key: 'round32', label: 'Round of 32', matches: 16 },
    { key: 'round16', label: 'Round of 16', matches: 8 },
    { key: 'quarterFinals', label: 'Quarter-finals', matches: 4 },
    { key: 'semiFinals', label: 'Semi-finals', matches: 2 }
  ];
  for (const stage of stages) {
    const winners = knockoutWinners[stage.key] || {};
    const matchIds = Object.keys(winners).sort((a,b) => a-b);
    if (matchIds.length > 0) {
      knockoutHtml += `<h3 style="margin-top: 20px; font-weight: bold;">${stage.label}</h3><ul style="list-style: none; padding-left: 0;">`;
      for (const id of matchIds) {
        knockoutHtml += `<li>Match ${id}: ${flag(winners[id])} ${winners[id]}</li>`;
      }
      knockoutHtml += `</ul>`;
    }
  }
  // Third-place and final
  if (knockoutWinners.thirdPlace) {
    knockoutHtml += `<h3 style="margin-top: 20px; font-weight: bold;">Third-Place Match</h3><ul style="list-style: none; padding-left: 0;"><li>${flag(knockoutWinners.thirdPlace)} ${knockoutWinners.thirdPlace}</li></ul>`;
  }
  if (knockoutWinners.final) {
    knockoutHtml += `<h3 style="margin-top: 20px; font-weight: bold; color: #dc2626;">🏆 Champion</h3><ul style="list-style: none; padding-left: 0;"><li>${flag(knockoutWinners.final)} ${knockoutWinners.final}</li></ul>`;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">Your World Cup 2026 Prediction</h2>
      <p>Hello ${name || 'football fan'},</p>
      <p>Thank you for confirming your prediction. Here is the summary of your picks:</p>
      ${groupsHtml}
      <h3 style="font-weight: bold; margin-top: 20px;">Third-Place Qualifiers (8 best)</h3>
      ${thirdHtml}
      <h3 style="font-weight: bold; margin-top: 20px;">Knockout Stage Winners</h3>
      ${knockoutHtml}
      <hr style="margin: 30px 0;">
      <p>You can view the live leaderboard at <a href="https://90minutesormore.com/leaderboard.html">https://90minutesormore.com/leaderboard.html</a></p>
      <p>Follow the tournament and see how your predictions stack up!</p>
      <p>— 90 Minutes or More Team</p>
    </div>
  `;
}