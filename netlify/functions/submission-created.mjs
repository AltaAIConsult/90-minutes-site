export const handler = async (event, context) => {
  try {
    const payload = JSON.parse(event.body);
    
    // Only process the POTY vote form
    if (payload.form_name !== 'poty-vote') {
      return { statusCode: 200, body: 'Not a POTY vote' };
    }

    const { player, email } = payload.data;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return { statusCode: 500, body: 'Server configuration error' };
    }

    // The HTML Email Template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 20px; background-color: #000;">
              <img src="https://90minutesormore.com/images/logo.jpeg" alt="90 Minutes or More" style="width: 150px; height: auto;">
          </div>
          
          <!-- Body -->
          <div style="padding: 30px 20px;">
              <h1 style="color: #fbbf24; font-size: 24px; text-align: center; margin-bottom: 20px;">Your Vote is Confirmed</h1>
              
              <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #cccccc;">
                  Thank you for voting for <strong style="color: #fbbf24;">${player}</strong> in the 90 Minutes or More Player of the Season awards. Your vote has been successfully recorded.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #cccccc;">
                  Stay tuned! We will announce the winner on <strong style="color: #ffffff;">December 28th, 2026</strong>.
              </p>
              
              <!-- Buttons -->
              <div style="text-align: center; margin-top: 30px;">
                  <a href="https://90minutesormore.com/shop/index.html" style="display: inline-block; background-color: #fbbf24; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">Shop the 90M Store</a>
                  <a href="https://90minutesormore.com/news/index.html" style="display: inline-block; background-color: transparent; color: #ffffff; border: 1px solid #ffffff; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">Read the Latest News</a>
                  <a href="https://90minutesormore.com/contact/index.html" style="display: inline-block; background-color: transparent; color: #ffffff; border: 1px solid #ffffff; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">Work With Us</a>
              </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #000; padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>You received this email because you voted on 90minutesormore.com.</p>
              <p>© 2026 90 Minutes or More. All rights reserved.</p>
          </div>
      </div>
    `;

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: '90 Minutes or More Stadium Zone <stadiumzone@90minutesormore.com>',
        reply_to: 'hello@90minutesormore.com',
        to: [email],
        subject: `Your vote for ${player} is confirmed!`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend Error:', errorData);
      return { statusCode: 500, body: JSON.stringify(errorData) };
    }

    return { statusCode: 200, body: 'Email sent successfully' };

  } catch (error) {
    console.error('Function Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};