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
    const html = `<p>Hi there,</p>
<p>Thank you for voting for <strong>${safePlayer}</strong> in the 90 Minutes or More Player of the Season awards. Your vote has been recorded.</p>
<p>Stay tuned! We will announce the results on <strong>December 28th, 2026</strong>.</p>
<p>Need the latest 90 Minutes or More gear? <a href="https://90minutesormore.com/shop/index.html">Shop right here.</a></p>
<p>— 90 Minutes or More</p>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: '"Stadium Zone" <stadiumzone@90minutesormore.com>',
        to: [email],
        reply_to: "hello@90minutesormore.com",
        subject: `Thank you for voting, ${player}!`,
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
