// Netlify event-triggered function: runs automatically for every verified
// (non-spam) Netlify Forms submission on this site.

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

export const handler = async (event, context) => {
  let payload;
  try {
    const body = JSON.parse(event.body || "{}");
    // Netlify wraps the submission in a `payload` key
    payload = body.payload || body;
  } catch (error) {
    console.error("submission-created: invalid JSON body", error);
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  // Fan Poll results are tallied live from Netlify Forms submissions by
  // get-poll-results.mjs, so poll submissions need no handling here.
  if (payload.form_name !== "poty-vote") {
    return { statusCode: 200, body: "Ignored: not a poty-vote submission" };
  }

  const { player, email } = payload.data || {};

  try {
    if (!player || !email) {
      throw new Error("Missing player or email in submission");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const safePlayer = escapeHtml(player);

    // The NEW Corporate HTML Email Template
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
          <div style="text-align: center; padding: 30px 20px; background-color: #000;">
              <img src="https://90minutesormore.com/images/logo.jpeg" alt="90 Minutes or More" style="width: 150px; height: auto;">
          </div>
          <div style="padding: 30px 20px;">
              <h1 style="color: #fbbf24; font-size: 24px; text-align: center; margin-bottom: 20px;">Your Vote is Confirmed</h1>
              <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #cccccc;">
                  Thank you for voting for <strong style="color: #fbbf24;">${safePlayer}</strong> in the 90 Minutes or More Player of the Season awards. Your vote has been successfully recorded.
              </p>
              <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #cccccc;">
                  Stay tuned! We will announce the winner on <strong style="color: #ffffff;">December 28th, 2026</strong>.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                  <a href="https://90minutesormore.com/shop/index.html" style="display: inline-block; background-color: #fbbf24; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">Shop the 90M Store</a>
                  <a href="https://90minutesormore.com/news/index.html" style="display: inline-block; background-color: transparent; color: #ffffff; border: 1px solid #ffffff; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">Read the Latest News</a>
                  <a href="https://90minutesormore.com/contact/index.html" style="display: inline-block; background-color: transparent; color: #ffffff; border: 1px solid #ffffff; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px;">Work With Us</a>
              </div>
          </div>
          <div style="background-color: #000; padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>You received this email because you voted on 90minutesormore.com.</p>
              <p>© 2026 90 Minutes or More. All rights reserved.</p>
          </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: '"90 Minutes or More Stadium Zone" <stadiumzone@send.90minutesormore.com>',
        to: [email],
        reply_to: "hello@90minutesormore.com",
        subject: `Your vote for ${safePlayer} is confirmed!`,
        html,
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || `Resend API error (${res.status})`);
    }

    console.log(`submission-created: confirmation sent to voter (Resend id ${result.id})`);
    return { statusCode: 200, body: "Vote confirmation email sent" };
  } catch (error) {
    console.error("submission-created failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};