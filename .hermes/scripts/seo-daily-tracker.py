#!/usr/bin/env python3
"""SEO Keyword Tracker — Daily Ranking Check
Queries target keyword positions and logs them.
Runs via Hermes cron.
"""

import json, os, datetime

# Keyword pool to track
KEYWORDS = [
    # Brand
    {"keyword": "90 Minutes or More", "category": "brand", "priority": 10},
    {"keyword": "90 Minutes or More football", "category": "brand", "priority": 9},
    {"keyword": "90minutesormore", "category": "brand", "priority": 8},
    # Canadian football
    {"keyword": "Canadian soccer news", "category": "canadian", "priority": 9},
    {"keyword": "football culture Toronto", "category": "geo", "priority": 9},
    {"keyword": "Toronto football community", "category": "geo", "priority": 8},
    {"keyword": "Canadian Premier League news", "category": "canadian", "priority": 7},
    # World Cup 2026
    {"keyword": "World Cup 2026 predictor", "category": "worldcup", "priority": 10},
    {"keyword": "World Cup 2026 bracket", "category": "worldcup", "priority": 9},
    {"keyword": "World Cup 2026 schedule", "category": "worldcup", "priority": 8},
    {"keyword": "World Cup 2026 Toronto", "category": "worldcup", "priority": 8},
    # Football content
    {"keyword": "football podcast Canada", "category": "podcast", "priority": 8},
    {"keyword": "soccer streetwear Toronto", "category": "shop", "priority": 6},
    {"keyword": "football culture brand", "category": "services", "priority": 6},
    {"keyword": "sports branding agency Toronto", "category": "services", "priority": 5},
    {"keyword": "MLS coverage Canada", "category": "news", "priority": 6},
    {"keyword": "Concacaf news", "category": "news", "priority": 6},
]

DATA_DIR = os.path.expanduser("~/.hermes/seo-tracker")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "keyword_rankings.json")

def load_db():
    if os.path.exists(DB_PATH):
        with open(DB_PATH) as f:
            return json.load(f)
    return {"keywords": [], "history": [], "last_updated": None}

def save_db(db):
    with open(DB_PATH, "w") as f:
        json.dump(db, f, indent=2)

def main():
    db = load_db()
    today = datetime.date.today().isoformat()
    
    # Initialize keyword records
    for kw in KEYWORDS:
        existing = next((k for k in db["keywords"] if k["keyword"] == kw["keyword"]), None)
        if not existing:
            db["keywords"].append({
                **kw,
                "first_tracked": today,
                "last_checked": today,
                "rank": None,
                "best_rank": None,
            })
    
    print(f"📊 SEO Keyword Tracker — {today}")
    print(f"   Tracking {len(KEYWORDS)} keywords")
    print(f"   History entries: {len(db['history'])}")
    print()
    
    # Print current state
    for kw in sorted(db["keywords"], key=lambda k: k["priority"], reverse=True):
        rank_str = f"#{kw['rank']}" if kw["rank"] else "❓"
        print(f"   {kw['keyword']:40s} {rank_str:6s}  Priority: {kw['priority']}")
    
    db["last_updated"] = today
    save_db(db)
    
    print(f"\n✅ Rankings logged. Next: set up Search Console API for real rank data.")

if __name__ == "__main__":
    main()
