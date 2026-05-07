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

    const { data: existingVerified } = await supabase
      .from('verified_submissions')
      .select('email')
      .eq('email', email)
      .single();

    if (existingVerified) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'This email has already submitted a verified prediction' })
      };
    }

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

    const confirmUrl = `https://90minutesormore.com/.netlify/functions/confirm?token=${token}`;
    
    const msg = {
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'Confirm Your 90 Minutes or More World Cup Prediction',
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 16px; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://90minutesormore.com/images/logo.jpeg" alt="90 Minutes or More" style="width: 60px; height: auto; margin-bottom: 16px;">
            <h1 style="color: #dc2626; font-size: 28px; margin: 0;">World Cup 2026 Predictor</h1>
          </div>
          
          <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <p style="font-size: 18px; margin-bottom: 16px;">Hello <strong>${escapeHtml(name || 'football fan')}</strong>,</p>
            <p style="margin-bottom: 24px;">Thank you for submitting your World Cup 2026 prediction!</p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px;">⏳ Your prediction is pending. Click the button below to verify your email and be added to the leaderboard.</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${confirmUrl}" style="display: inline-block; background-color: #dc2626; color: white; font-weight: bold; padding: 14px 32px; text-decoration: none; border-radius: 8px;">Confirm My Prediction</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 8px;">Or copy and paste this link:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${confirmUrl}</p>
            
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              If you did not submit this prediction, please ignore this email.<br>
              — 90 Minutes or More Team
            </p>
          </div>
        </div>
      `,
      text: `
        Confirm Your 90 Minutes or More World Cup Prediction
        
        Hello ${name || 'football fan'},
        
        Thank you for submitting your World Cup 2026 prediction!
        
        Your prediction is pending. Click the link below to verify your email and be added to the leaderboard:
        
        ${confirmUrl}
        
        If you did not submit this prediction, please ignore this email.
        
        — 90 Minutes or More Team
      `
    };

    await sgMail.send(msg);
    console.log(`✅ Confirmation email sent to ${email}`);

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

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}