# Who In The Room 👀

A real-time party game for 3–20 friends. Each question is about the group
("Who in the group is the most self-obsessed?"). Everyone votes for a player,
and the name with the most votes is the right answer. Players who picked it
score by speed: the fastest gets 1000, then 850, 700, 550, 400, 250, and
everyone after that gets 100. Each round has 10 questions, and questions
never repeat within a room.

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

**Free-plan notes:** the server sleeps after 15 minutes with no visitors. The first person to
open the link waits about 30–60 seconds while it wakes up. Rooms live in memory, so a
restart or sleep ends any games in progress.
