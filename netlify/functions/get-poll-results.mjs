// Returns live Fan Poll vote counts and percentages for every poll form.
// Votes are recorded by submission-created.mjs as Netlify Forms submissions arrive.
import { getDatabase } from "@netlify/database";

export const POLL_FORMS = [
  "poll-serie-a-2026",
  "poll-premier-league-2026",
  "poll-la-liga-2026",
  "poll-champions-league-2026-27",
  "poll-europa-league-2026-27",
  "poll-copa-libertadores",
  "poll-copa-sudamericana",
];

export default async (req) => {
  try {
    const url = new URL(req.url);
    const requested = url.searchParams.get("form");
    const forms = requested ? POLL_FORMS.filter((f) => f === requested) : POLL_FORMS;
    if (requested && !forms.length) {
      return Response.json({ error: "Unknown poll" }, { status: 404 });
    }

    const db = getDatabase();
    const rows = await db.sql`
      SELECT form_name, choice, COUNT(*)::int AS votes
      FROM poll_votes
      WHERE form_name = ANY(${forms})
      GROUP BY form_name, choice
    `;

    const polls = Object.fromEntries(forms.map((f) => [f, { total: 0, counts: {} }]));
    for (const row of rows) {
      const poll = polls[row.form_name];
      poll.counts[row.choice] = row.votes;
      poll.total += row.votes;
    }
    for (const poll of Object.values(polls)) {
      poll.percentages = Object.fromEntries(
        Object.entries(poll.counts).map(([choice, n]) => [choice, Math.round((n / poll.total) * 100)])
      );
    }

    return Response.json(
      { polls },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("get-poll-results failed:", error);
    return Response.json({ error: "Could not load poll results" }, { status: 500 });
  }
};

export const config = { path: "/api/poll-results" };
