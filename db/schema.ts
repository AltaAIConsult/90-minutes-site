import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

// One row per verified Fan Poll vote (recorded from Netlify Forms submissions)
export const pollVotes = pgTable(
  "poll_votes",
  {
    id: serial().primaryKey(),
    formName: text("form_name").notNull(),
    choice: text().notNull(),
    submissionId: text("submission_id").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("poll_votes_form_name_idx").on(t.formName)]
);
