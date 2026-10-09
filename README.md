# Who In The Room 👀

[![CI](https://github.com/me-As-NRB/sillygroup/actions/workflows/ci.yml/badge.svg)](https://github.com/me-As-NRB/sillygroup/actions/workflows/ci.yml)

A real-time multiplayer game for 2–20 people. Each question is about the group
("Who's most likely to forget their bag on a trek?"). Everyone votes for a player, and the
name with the most votes is the right answer. Players who picked it score by speed: the
fastest gets 1000, then 850, 700, 550, 400, 250, and everyone after that gets 100. A round
has 10 questions, and questions never repeat within a room.

- The host picks one of 20 themes, can describe the group in their own words, and sets
  the tone (Friendly / Blunt / Savage). AI writes questions to match.
- After each question everyone sees who voted for whom.
- **Couple mode** (2 players): questions about the relationship; you score only when you both
  pick the same partner, the screen turns romantic, and the round ends with "You matched on X of 10".
- Hinglish (default) or English; questions spread across different life areas each round and
  never repeat, even reworded, for the same host; 10 questions per round, each on a different topic.
- Players only type their name and join by link or 4-letter code. Refreshing the page
  rejoins the same game.
- Shareable result card after each round, WhatsApp/Instagram link previews, sound effects
  and confetti, all generated in the browser.
- Works on phones and laptops, with keyboard and screen-reader support.

## Tech

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite; Canvas share card; Web Audio sound; self-hosted fonts; game screens code-split |
| Backend | Node, Express, Socket.IO (typed events), TypeScript bundled with esbuild |
| Shared | One set of types and game rules (`shared/`) used by both client and server |
| AI | Google Gemini, Groq, OpenRouter or Anthropic Claude, with an offline question bank (themed scenario questions for every theme) as fallback |
| Data | Upstash Redis (REST) for stats, optional GoatCounter for visits |
| Quality | ESLint, `tsc --strict`, Vitest unit + socket integration tests, Playwright E2E (desktop + mobile) with axe accessibility scans, GitHub Actions CI |

**Lighthouse (mobile, simulated slow 4G):** Performance 90, Accessibility 100, Best Practices 100, SEO 100.

### Design notes

- **The server is in charge.** All votes, timing and scoring happen in `server/game.ts`.
  Clients get a full snapshot of the game after every change and only render it, so a player
  can't cheat by editing the page.
- **Countdowns don't depend on phone clocks.** The server sends *time remaining*, not an end
  time, so a phone with the wrong clock still shows the right countdown.
- **Game logic is a plain class with dependencies passed in** (AI, stats, timings, clock).
  Tests run a full round with fake timers in milliseconds, without any network.
- **Reconnect tokens:** each player gets a private token kept in `sessionStorage`. A refresh
  or network drop rejoins the same seat; the host role passes on after a 10-second grace period.
- **Abuse limits:** room creation is limited per IP and socket events per connection.
  All input is checked on the server, user text is never inserted as HTML, and the stats page
  uses a constant-time key comparison.
- **Prompt safety:** the host's description goes into the AI prompt fenced as data, not as
  instructions.

### Project layout

```
shared/    types, game rules (scoring, vote tally), themes
server/    game.ts (Room, RoomManager), app.ts (HTTP + sockets), ai.ts, questions.ts, stats.ts, pages.ts
client/    React app: hooks/useGame.ts, screens/, components/, lib/ (sound, confetti, share card)
tests/     Vitest: rules, game flow, questions/AI parsing, pages, client helpers, socket integration
e2e/       Playwright: 3 browsers play a full round; accessibility scans; refresh-rejoin
```

## Develop

```bash
npm install
```
```bash
npm run dev
```

This starts the game server on port 3000 and the Vite dev server at http://localhost:5173
(which forwards socket traffic to the game server). To test alone, open 3 browser windows,
or use your phone on the same Wi-Fi at `http://<your-PC-IP>:5173`.

| Command | What it does |
|---|---|
| `npm run check` | Lint, type check, unit and integration tests |
| `npm run test:e2e` | Builds the app and plays full games in real browsers |
| `npm run build` then `npm start` | Production build, served at http://localhost:3000 |

## Deploy (Render, free)

Render reads `render.yaml`: it runs `npm ci && npm run build`, then `npm start`. Every push to
`main` redeploys automatically. Set these under **Environment** (all optional):

| Variable | What it does |
|---|---|
| `GEMINI_API_KEY` | AI questions via Google Gemini (`gemini-flash-lite-latest`, then `gemini-flash-latest`; change the first with `GEMINI_MODEL`). |
| `GROQ_API_KEY` | AI questions via Groq: fast open models (`openai/gpt-oss-120b`, then `qwen/qwen3.8-27b`; change the first with `GROQ_MODEL`). |
| `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2` | AI questions via OpenRouter (defaults to free models; change with `OPENROUTER_MODEL`). |
| `ANTHROPIC_API_KEY` | AI questions via Claude (paid; change model with `CLAUDE_MODEL`, default `claude-opus-5-5`). |
| `STATS_KEY` | Secret phrase for your private stats page at `/stats?key=<STATS_KEY>`. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Keep stats permanently (free Redis at upstash.com). Without them, stats reset when the server sleeps. |
| `GOATCOUNTER_CODE` | Count visitors with GoatCounter, e.g. `whoinroom`. |

Every AI with a key is tried in this order (Gemini → Groq → OpenRouter → Claude) until one answers; only then are built-in questions used. Each failure is logged with its reason. Never put keys in the code or commit them.

**Free-plan notes:** the server sleeps after 15 minutes with no visitors, and the first
visitor then waits about 30–60 seconds. Rooms live in memory on one server, so a restart ends
games in progress. Running several servers would need a shared store (e.g. the Socket.IO Redis
adapter).
