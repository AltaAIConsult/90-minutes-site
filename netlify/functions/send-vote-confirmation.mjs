const FROM_ADDRESS = "90 Minutes or More <hello@90minutesormore.com>";
const SHOP_URL = "https://90minutesormore.com/shop/";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

export async function sendVoteConfirmation({ player, email }) {
  if (!player || !email) {
    throw new Error("Missing player or email");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const safePlayer = escapeHtml(player);
  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #111;">
      <p>Hi there,</p>
      <p>Thank you for voting for <strong>${safePlayer}</strong> in the 90 Minutes or More Player of the Season awards. Your vote has been recorded.</p>
      <p>Stay tuned! We will announce the results on December 28th, 2026.</p>
      <p>Need the latest 90 Minutes or More gear? <a href="${SHOP_URL}">Shop right here</a>.</p>
      <p>&mdash; 90 Minutes or More</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [email],
      subject: `Thank you for voting, ${player}!`,
      html,
    }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.message || `Resend API error (${res.status})`);
  }
  return result;
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    });
  }

  try {
    const body = await req.json();
    // Accept either the raw form data or a Netlify submission payload shape
    const data = body?.payload?.data ?? body?.data ?? body;
    const result = await sendVoteConfirmation({
      player: data.player,
      email: data.email,
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-vote-confirmation failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
