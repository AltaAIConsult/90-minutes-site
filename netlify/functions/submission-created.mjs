// Netlify event-triggered function: runs automatically for every verified
// (non-spam) Netlify Forms submission on this site.
import { sendVoteConfirmation } from "./send-vote-confirmation.mjs";

export const handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body || "{}");
    const formName = payload?.form_name || payload?.data?.["form-name"];

    if (formName !== "poty-vote") {
      return { statusCode: 200, body: "Ignored: not a poty-vote submission" };
    }

    const { player, email } = payload.data || {};
    await sendVoteConfirmation({ player, email });

    return { statusCode: 200, body: "Vote confirmation email sent" };
  } catch (error) {
    console.error("submission-created failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
