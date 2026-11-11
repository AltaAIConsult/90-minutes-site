// Returns live Fan Poll results by tallying the real Netlify Forms submissions
// through the Netlify API. Usage: /.netlify/functions/get-poll-results?poll=poll-serie-a-2026
//
// Response: { "results": { "Inter": 45, "Milan": 30, ... }, "counts": { ... }, "total": 100 }
// `results` holds whole-number percentages; `counts` holds raw vote counts.

const API = "https://api.netlify.com/api/v1";
const PER_PAGE = 100;
const MAX_PAGES = 50; // safety cap: up to 5,000 submissions per poll

// Only poll forms can be queried, so this endpoint can't expose other forms' data
const isPollForm = (name) => /^poll-[a-z0-9-]+$/.test(name);

// Form IDs never change, so cache the name -> id lookup per function instance
let formIdCache = null;

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function netlifyApi(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "poll-results-function" },
  });
  if (!res.ok) throw new Error(`Netlify API ${path} failed (${res.status})`);
  return res.json();
}

async function getFormId(siteId, token, formName) {
  if (!formIdCache || !formIdCache.has(formName)) {
    const forms = await netlifyApi(`/sites/${siteId}/forms`, token);
    formIdCache = new Map(forms.map((f) => [f.name, f.id]));
  }
  return formIdCache.get(formName);
}

async function getAllSubmissions(formId, token) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await netlifyApi(
      `/forms/${formId}/submissions?per_page=${PER_PAGE}&page=${page}`,
      token
    );
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

export default async (req) => {
  const poll = new URL(req.url).searchParams.get("poll") || "";
  if (!isPollForm(poll)) {
    return json({ error: "Missing or invalid ?poll= parameter" }, 400);
  }

  const token = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  if (!token || !siteId) {
    console.error("get-poll-results: NETLIFY_ACCESS_TOKEN or NETLIFY_SITE_ID is not set");
    return json({ error: "Poll results are not configured" }, 500);
  }

  try {
    const formId = await getFormId(siteId, token, poll);
    if (!formId) return json({ error: "Unknown poll" }, 404);

    const submissions = await getAllSubmissions(formId, token);

    // Each poll form submits its choice in the `vote` field
    const counts = {};
    for (const s of submissions) {
      const choice = String(s?.data?.vote ?? "").trim();
      if (choice) counts[choice] = (counts[choice] || 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const results = Object.fromEntries(
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([choice, n]) => [choice, Math.round((n / total) * 100)])
    );

    return json({ poll, results, counts, total });
  } catch (error) {
    console.error("get-poll-results failed:", error);
    return json({ error: "Could not load poll results" }, 502);
  }
};
