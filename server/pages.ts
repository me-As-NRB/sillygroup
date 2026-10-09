import { GENRES, TONES } from "../shared/genres";
import { COUNTERS, type StatsSnapshot } from "./stats";

export const escapeHtml = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Fills the <!--HEAD--> slot of the built index.html with link-preview tags
 * (WhatsApp, Instagram…) and, if configured, the GoatCounter visitor counter.
 */
export function renderIndex(template: string, opts: { origin: string; roomCode?: string; goatcounterCode?: string }): string {
  const { origin, goatcounterCode } = opts;
  const code = (opts.roomCode ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  const title = code ? `Join my game! Room ${code} · Who In The Room` : "Who In The Room — how well do you know your group?";
  const desc = code
    ? "Tap to join with just your name. Cheeky questions about the group: vote who fits, fastest right guess wins!"
    : "Cheeky AI questions about your group. Vote who fits, guess the majority, fastest right answer wins. Free, no app needed.";
  const url = code ? `${origin}/?room=${code}` : `${origin}/`;
  const gc = (goatcounterCode ?? "").replace(/[^a-z0-9-]/gi, "");
  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Who In The Room">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(origin)}/og.jpg">`,
    `<meta property="og:image:type" content="image/jpeg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    gc ? `<script data-goatcounter="https://${gc}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>` : ""
  ].join("\n    ");
  return template.replace("<!--HEAD-->", tags);
}

export function renderStatsPage({ total, genres, tones, daily }: StatsSnapshot, persistent: boolean): string {
  const n = (k: string) => total[k] ?? 0;
  const avgPlayers = n("rounds_finished") ? (n("players_in_finished_rounds") / n("rounds_finished")).toFixed(1) : "–";
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
  const maxDay = Math.max(1, ...daily.map((d) => d.counts.players_joined ?? 0));
  const genreRows = Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id, c]) => {
      const g = GENRES.find((x) => x.id === id);
      return `<tr><td>${g ? `${g.emoji} ${escapeHtml(g.label)}` : "🎲 None picked"}</td><td>${c}</td></tr>`;
    })
    .join("");
  const toneRows = Object.entries(tones)
    .map(([id, c]) => `<tr><td>${escapeHtml(TONES.find((t) => t.id === id)?.label ?? id)}</td><td>${c}</td></tr>`)
    .join("");
  const tiles = [
    ["Players joined", n("players_joined")],
    ["Rooms created", n("rooms_created")],
    ["Rounds finished", n("rounds_finished")],
    ["Avg players / round", avgPlayers],
    ["Rooms that played again", pct(n("rooms_replayed"), n("rooms_created"))],
    ["Rounds started that finished", pct(n("rounds_finished"), n("rounds_started"))]
  ]
    .map(([label, value]) => `<div class="tile"><b>${value}</b><span>${label}</span></div>`)
    .join("");
  const bars = daily
    .map((d) => {
      const v = d.counts.players_joined ?? 0;
      return `<div class="day" title="${d.date}: ${v} players, ${d.counts.rounds_finished ?? 0} rounds"><i style="height:${(v / maxDay) * 100}%"></i><small>${d.date.slice(8)}</small><em>${v || ""}</em></div>`;
    })
    .join("");
  const allRows = Object.entries(COUNTERS)
    .map(([k, label]) => `<tr><td>${label}</td><td>${n(k)}</td></tr>`)
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Game Stats</title><meta name="robots" content="noindex"><style>
:root{--bg:#f6f4ff;--card:#fff;--text:#1f1537;--muted:#6e6489;--line:#e6e0fa;--brand:#6d4aff}
@media (prefers-color-scheme:dark){:root{--bg:#0f0b1f;--card:#1e1838;--text:#f5f2ff;--muted:#a9a2c8;--line:#322a57;--brand:#8d70ff}}
body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:20px 16px;display:grid;gap:16px}
h1{margin:0;font-size:1.6rem}.muted{color:var(--muted)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.tile,.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.tile b{display:block;font-size:1.8rem;color:var(--brand)}.tile span{color:var(--muted);font-size:.85rem}
.chart{display:flex;align-items:flex-end;gap:6px;height:160px;padding-top:18px}
.day{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;position:relative}
.day i{width:100%;background:var(--brand);border-radius:6px 6px 2px 2px;min-height:2px}
.day small{color:var(--muted);font-size:.7rem;margin-top:4px}.day em{position:absolute;top:0;font-style:normal;font-size:.7rem}
table{width:100%;border-collapse:collapse}td{padding:7px 4px;border-bottom:1px solid var(--line)}td:last-child{text-align:right;font-weight:600}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}h2{margin:0 0 8px;font-size:1.05rem}
</style></head><body><main>
<div><h1>👀 Who In The Room — stats</h1><p class="muted">${persistent ? "Saved permanently (Upstash)." : "⚠️ Not saved: numbers reset whenever the server restarts. Add Upstash keys to keep them."}</p></div>
<div class="tiles">${tiles}</div>
<div class="card"><h2>Players joined per day (last 14 days)</h2><div class="chart">${bars}</div></div>
<div class="cols"><div class="card"><h2>Most picked themes</h2><table>${genreRows || "<tr><td class=muted>No rounds yet</td></tr>"}</table></div>
<div class="card"><h2>Tone</h2><table>${toneRows || "<tr><td class=muted>No rounds yet</td></tr>"}</table><h2 style="margin-top:16px">All totals</h2><table>${allRows}</table></div></div>
</main></body></html>`;
}
