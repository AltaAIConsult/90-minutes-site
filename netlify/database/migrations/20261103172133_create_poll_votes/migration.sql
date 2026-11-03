CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY,
	"form_name" text NOT NULL,
	"choice" text NOT NULL,
	"submission_id" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "poll_votes_form_name_idx" ON "poll_votes" ("form_name");