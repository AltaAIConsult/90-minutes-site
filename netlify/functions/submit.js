const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    const { email, name, prediction } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    // Check if already verified
    const { data: existingVerified } = await supabase
      .from('verified_submissions')
      .select('email')
      .eq('email', email)
      .single();

    if (existingVerified) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email already submitted a prediction' })
      };
    }

    // Insert into pending
    const { error } = await supabase
      .from('pending_submissions')
      .insert([
        {
          email: email,
          name: name || null,
          prediction: prediction,
          token: token
        }
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save prediction' })
      };
    }

    // ✅ CORRECTED CONFIRMATION URL
    const confirmUrl = `https://90minutesormore.com/.netlify/functions/confirm?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'Confirm Your 90 Minutes or More World Cup Prediction',
      html: `
        <h2>Thank you for submitting your World Cup 2026 prediction!</h2>
        <p>Please click the link below to confirm your email and be added to the leaderboard:</p>
        <p><a href="${confirmUrl}">${confirmUrl}</a></p>
        <p>If you did not submit this prediction, please ignore this email.</p>
        <br>
        <p>— 90 Minutes or More Team</p>
      `,
      text: `
        Thank you for submitting your World Cup 2026 prediction!
        
        Please copy and paste this link into your browser to confirm your email and be added to the leaderboard:
        
        ${confirmUrl}
        
        If you did not submit this prediction, please ignore this email.
        
        — 90 Minutes or More Team
      `
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Prediction submitted. Check your email to confirm.',
        token: token
      })
    };

  } catch (error) {
    console.error('Submit function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};