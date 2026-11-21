# 🌿 Break Buddy

A break-taking companion for people who don't fit the 25/5 mold.

- **Choose your rhythm**: presets or custom (focus 30–150 min, break 5–30 min), with soft nudges instead of hard rules.
- **Save your train of thought**: jot a note anytime while working. When time's up, you're asked "where were you?" and "what's next?" before you leave.
- **Limited snoozes**: "5 more min" works twice per session, then the break wins.
- **Break suggestions**: pick from ideas grouped by category (Move, Rest eyes, Refuel, Reset mind, Connect, Outside), filtered to fit your break length.
- **Welcome back**: your note is the first thing you see when you return.

No build step. Plain HTML/CSS/JS. Progress is saved in `localStorage`, so a refresh won't lose your timer.

## Run locally
Open `index.html` in a browser, or run:
```bash
npx serve .
```

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel, click **Add New → Project**, import the repo, and leave the framework preset as **Other**.
3. Click **Deploy**.

## Customize
At the top of `app.js`:
- `LIMITS`: min/max for work and break
- `MAX_SNOOZES` / `SNOOZE_MIN`: how many extensions you get
- `PRESETS`: the rhythm cards
- `BREAKS`: break ideas (`min` = shortest break it fits in)

## Notes
- Allow notifications when asked so you get alerted while you're in another tab.
- Browsers slow down timers in background tabs, so the timer is based on an end timestamp to stay accurate.
