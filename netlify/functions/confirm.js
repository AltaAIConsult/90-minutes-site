const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token = event.queryStringParameters.token;

  if (!token) {
    return {
      statusCode: 400,
      body: '<h1>Invalid confirmation link</h1><p>No token provided.</p>'
    };
  }

  try {
    // Find pending submission with this token
    const { data: pending, error: findError } = await supabase
      .from('pending_submissions')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !pending) {
      return {
        statusCode: 404,
        body: '<h1>Invalid or expired confirmation link</h1><p>The token is invalid or has already been used.</p>'
      };
    }

    // Extract champion from prediction
    let champion = null;
    if (pending.prediction && pending.prediction.knockoutWinners) {
      champion = pending.prediction.knockoutWinners.final;
    }

    // Move to verified_submissions
    const { error: insertError } = await supabase
      .from('verified_submissions')
      .insert([
        {
          email: pending.email,
          name: pending.name,
          prediction: pending.prediction,
          submitted_at: pending.submitted_at,
          verified_at: new Date().toISOString(),
          champion: champion,
          score: null
        }
      ]);

    if (insertError) {
      console.error('Insert to verified failed:', insertError);
      return {
        statusCode: 500,
        body: '<h1>Error</h1><p>Could not verify your submission. Please contact support.</p>'
      };
    }

    // Delete from pending
    await supabase
      .from('pending_submissions')
      .delete()
      .eq('token', token);

    // Return success page
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Prediction Confirmed | 90 Minutes or More</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #22c55e; }
            p { color: #333; line-height: 1.6; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Prediction Confirmed!</h1>
            <p>Your World Cup 2026 prediction has been verified.</p>
            <p>You are now on the leaderboard. Thank you for participating!</p>
            <a href="https://90minutesormore.com/leaderboard.html" class="button">View Leaderboard</a>
          </div>
        </body>
        </html>
      `
    };

  } catch (error) {
    console.error('Confirm function error:', error);
    return {
      statusCode: 500,
      body: '<h1>Error</h1><p>Internal server error.</p>'
    };
  }
};