import { genreById } from "../../../shared/genres";
import type { FinalView } from "../../../shared/types";

// Draws a 1080x1350 (Instagram portrait) result card and returns it as a PNG blob.
const W = 1080;
const H = 1350;
const FONT_DISPLAY = "'Fredoka Variable', 'Segoe UI', sans-serif";
const FONT_BODY = "'Inter Variable', 'Segoe UI', sans-serif";
type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Shrinks the font until the text fits on one line.
function fitText(ctx: Ctx, text: string, maxWidth: number, size: number, weight: number, family: string): void {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 24);
}

export async function makeShareCard({ leaderboard, highlights, genres, youId }: FinalView & { youId: string }): Promise<Blob | null> {
  // Canvas text only uses fonts that are already loaded, so load both explicitly.
  await Promise.all([document.fonts.load(`700 40px ${FONT_DISPLAY}`), document.fonts.load(`600 34px ${FONT_BODY}`)]).catch(() => {});
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#5b3cff");
  bg.addColorStop(0.55, "#d6409f");
  bg.addColorStop(1, "#ff9a3c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (const [x, y, r] of [[120, 160, 220], [980, 420, 260], [160, 1180, 240], [900, 1250, 180]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";

  // Header
  ctx.font = `600 44px ${FONT_DISPLAY}`;
  ctx.fillText("👀 Who In The Room", W / 2, 110);
  const theme = genres
    .flatMap((id) => {
      const g = genreById.get(id);
      return g ? [`${g.emoji} ${g.label}`] : [];
    })
    .join("  ·  ");
  if (theme) {
    ctx.font = `500 30px ${FONT_BODY}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    fitText(ctx, theme, W - 160, 30, 500, FONT_BODY);
    ctx.fillText(theme, W / 2, 160);
  }

  // Winner
  const top = leaderboard[0];
  const tied = leaderboard.filter((p) => top && p.score === top.score && top.score > 0);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 34px ${FONT_BODY}`;
  ctx.fillText(tied.length > 1 ? "🏆 JOINT WINNERS" : "🏆 ROUND WINNER", W / 2, 250);
  ctx.fillStyle = "#fff";
  const winnerText = tied.length ? tied.map((p) => p.name).join(" & ") : "Nobody scored!";
  fitText(ctx, winnerText, W - 140, 104, 700, FONT_DISPLAY);
  ctx.fillText(winnerText, W / 2, 350);

  // Leaderboard (top 3)
  let y = 400;
  const medals = ["🥇", "🥈", "🥉"];
  for (const [i, p] of leaderboard.slice(0, 3).entries()) {
    const me = p.id === youId;
    ctx.fillStyle = me ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.18)";
    roundRect(ctx, 90, y, W - 180, 76, 26);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = `500 46px ${FONT_BODY}`;
    ctx.fillText(medals[i], 120, y + 54);
    fitText(ctx, p.name + (me ? " (me)" : ""), 600, 42, 700, FONT_DISPLAY);
    ctx.fillText(p.name + (me ? " (me)" : ""), 200, y + 52);
    ctx.textAlign = "right";
    ctx.font = `700 40px ${FONT_DISPLAY}`;
    ctx.fillText(`${p.score}`, W - 125, y + 52);
    ctx.textAlign = "center";
    y += 90;
  }

  // Highlights: the group's most one-sided verdicts
  if (highlights.length) {
    y += 50;
    ctx.font = `700 40px ${FONT_DISPLAY}`;
    ctx.fillStyle = "#fff";
    ctx.fillText("🔥 The group has spoken", W / 2, y);
    y += 26;
    for (const h of highlights) {
      ctx.font = `500 34px ${FONT_BODY}`;
      const lines = wrap(ctx, `“${h.text}”`, W - 260).slice(0, 3);
      const boxH = 50 + lines.length * 44 + 60;
      if (y + boxH > H - 150) break;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      roundRect(ctx, 90, y, W - 180, boxH, 30);
      ctx.fill();
      ctx.fillStyle = "#3a2a6b";
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 58 + i * 44));
      ctx.fillStyle = "#d6409f";
      const verdict = `→ ${h.winners[0]}  (${h.topVotes}/${h.totalVotes} votes)`;
      fitText(ctx, verdict, W - 260, 44, 700, FONT_DISPLAY);
      ctx.fillText(verdict, W / 2, y + 58 + lines.length * 44 + 22);
      y += boxH + 20;
    }
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `600 34px ${FONT_BODY}`;
  ctx.fillText("Play free with your group →", W / 2, H - 100);
  ctx.font = `700 40px ${FONT_DISPLAY}`;
  ctx.fillText(location.host, W / 2, H - 50);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
