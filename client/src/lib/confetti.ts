// Small canvas confetti burst, no library needed. The canvas is created on first use.
const COLORS = ["#6d4aff", "#ff4f8b", "#ffb020", "#12c2b5", "#1e88e5", "#ffffff"];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
}

let canvas: HTMLCanvasElement | null = null;
let c2d: CanvasRenderingContext2D | null = null;
let pieces: Piece[] = [];
let running = false;

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (c2d) return c2d;
  canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const resize = () => {
    canvas!.width = innerWidth * devicePixelRatio;
    canvas!.height = innerHeight * devicePixelRatio;
  };
  addEventListener("resize", resize);
  resize();
  c2d = canvas.getContext("2d");
  return c2d;
}

export function confetti(amount = 140): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = ensureCanvas();
  if (!ctx || !canvas) return;
  const dpr = devicePixelRatio;
  for (let i = 0; i < amount; i++) {
    const fromLeft = i % 2 === 0;
    pieces.push({
      x: fromLeft ? 0 : canvas.width,
      y: canvas.height * 0.65,
      vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 9) * dpr,
      vy: -(9 + Math.random() * 11) * dpr,
      size: (6 + Math.random() * 6) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0
    });
  }
  if (!running) {
    running = true;
    requestAnimationFrame(step);
  }
}

function step(): void {
  if (!c2d || !canvas) return;
  c2d.clearRect(0, 0, canvas.width, canvas.height);
  const g = 0.32 * devicePixelRatio;
  pieces = pieces.filter((p) => p.y < canvas!.height + 40 && p.life < 400);
  for (const p of pieces) {
    p.life++;
    p.vy += g;
    p.vx *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    c2d.save();
    c2d.translate(p.x, p.y);
    c2d.rotate(p.rot);
    c2d.fillStyle = p.color;
    c2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    c2d.restore();
  }
  if (pieces.length) requestAnimationFrame(step);
  else {
    running = false;
    c2d.clearRect(0, 0, canvas.width, canvas.height);
  }
}
