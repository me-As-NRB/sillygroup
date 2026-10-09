import { aiEnabled, aiProvider, generateQuestions } from "./ai";
import { createGameServer } from "./app";
import { DEFAULT_TIMINGS } from "./game";
import { createStats } from "./stats";

const PORT = Number(process.env.PORT) || 3000;
const stats = createStats({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const server = createGameServer({
  deps: {
    generateQuestions,
    aiEnabled,
    tracker: stats,
    // REVEAL_MS lets end-to-end tests run a full round quickly.
    timings: { ...DEFAULT_TIMINGS, revealMs: Number(process.env.REVEAL_MS) || DEFAULT_TIMINGS.revealMs },
    now: Date.now
  },
  stats,
  clientDir: process.env.CLIENT_DIR,
  statsKey: process.env.STATS_KEY,
  goatcounterCode: process.env.GOATCOUNTER_CODE
});

server.httpServer.listen(PORT, () => {
  console.log(`Game running on http://localhost:${PORT} (AI questions: ${aiProvider ?? "off, using built-in list"})`);
});
