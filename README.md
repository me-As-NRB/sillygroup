# Who In The Room 👀

A real-time party game for 3–20 friends. Each question is about the group
("Who in the group is the most self-obsessed?"). Everyone votes for a player,
and the name with the most votes is the right answer. Players who picked it
score by speed: the fastest gets 1000, then 850, 700, 550, 400, 250, and
everyone after that gets 100. Each round has 10 questions, and questions
never repeat within a room.

- The host picks up to 3 of 50 themes (Trek, Party, Movies, Dating, Cricket…), can describe
  the group in their own words, and chooses how blunt the questions are (Friendly / Blunt / Savage).
- After each question everyone sees who voted for whom.
- Sound effects (with a mute button) and confetti, generated in the browser with no extra files.
- Players only type their name. One person creates a room and shares the link or code.
- Works on phones and laptops.
- Real-time over WebSockets (Socket.IO).
- AI-written questions when `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` is set. Otherwise
  (or if the AI call fails) it uses a built-in bank of 120 questions.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000. To test alone, open 3 browser windows (or a
private window plus your phone on the same Wi‑Fi at `http://<your-PC-IP>:3000`).

## Put it online for free (Render.com)

1. **Push the code to GitHub.** Create an empty repo at https://github.com/new, then in this folder run:
   ```bash
   git init
   git add .
   git commit -m "Who In The Room game"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. **Create the Render service.** Sign up at https://render.com with GitHub, then choose
   **New → Blueprint** and pick your repo. Render reads `render.yaml` and sets everything up
   on the free plan. (Or choose **New → Web Service** with build command `npm install` and
   start command `npm start`.)
3. **(Optional) Turn on AI questions.** In Render open **Environment** and add one of:
   - `OPENROUTER_API_KEY`: a key from https://openrouter.ai/keys. By default this uses
     OpenRouter's free models (`openrouter/free`). Set `OPENROUTER_MODEL` to pick a specific one.
   - `ANTHROPIC_API_KEY`: a key from https://console.anthropic.com (paid, a few cents per round).
     Set `CLAUDE_MODEL` to change the model; the default is `claude-opus-5-5`.

   Leave both empty to use the built-in questions. Never put keys in the code or commit them to GitHub.
4. Share your `https://<name>.onrender.com` link.

## Stats (how many people played)

Set these in Render → **Environment**. All are optional.

| Variable | What it does |
|---|---|
| `STATS_KEY` | Any long secret phrase you choose. Your private stats page is then at `https://<your-site>/stats?key=<STATS_KEY>`. |
| `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` | Keep the stats permanently. Create a free Redis database at https://upstash.com and copy the two **REST** values. Without them the numbers reset whenever the server sleeps. |
| `GOATCOUNTER_CODE` | Count website visitors with GoatCounter (free). Sign up at https://www.goatcounter.com, then enter just the code, e.g. `whoinroom` for `whoinroom.goatcounter.com`. |

The stats page shows players, rooms, finished rounds, average group size, how many rooms
played a second round, players who went on to create their own room, popular themes,
and a 14-day chart.

## Sharing

- After each round, players get a result card (podium plus the group's most one-sided
  verdicts) that they can share to Instagram or WhatsApp, or save as an image.
- Links show a proper preview (title, description, image) in WhatsApp, Instagram and other
  apps. Room links say "Join my game! Room ABCD".

**Free-plan notes:** the server sleeps after 15 minutes with no visitors. The first person to
open the link waits about 30–60 seconds while it wakes up. Rooms live in memory, so a
restart or sleep ends any games in progress.
