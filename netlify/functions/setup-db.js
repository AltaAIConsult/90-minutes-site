// netlify/functions/setup-db.js
// ONE-TIME setup endpoint — creates the match_results table
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async () => {
  try {
    // Create match_results table via SQL
    const sql = `
      CREATE TABLE IF NOT EXISTS match_results (
        match_id INTEGER PRIMARY KEY,
        home_score INTEGER,
        away_score INTEGER,
        status TEXT DEFAULT 'scheduled',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Check if verified_submissions has score column
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'verified_submissions' AND column_name = 'score'
        ) THEN
          ALTER TABLE verified_submissions ADD COLUMN score INTEGER DEFAULT 0;
        END IF;
      END $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct table check
      const { data: existing } = await supabase
        .from('match_results')
        .select('match_id')
        .limit(1);

      if (existing !== null) {
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'match_results table already exists and is accessible',
            sample: existing
          })
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Could not create table via RPC. Please create manually in Supabase dashboard SQL editor.',
          detail: error.message,
          sql_to_run: `CREATE TABLE match_results (
  match_id INTEGER PRIMARY KEY,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'match_results table created successfully' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
