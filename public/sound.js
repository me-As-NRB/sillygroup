// Sound effects synthesised with the Web Audio API, so there are no audio files to host.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem("witr-muted") === "1"; } catch {}

// Browsers only allow audio after a user gesture; call this from any click.
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) ctx = new AC();
}

export function isMuted() { return muted; }
export function setMuted(v) {
  muted = v;
  try { localStorage.setItem("witr-muted", v ? "1" : "0"); } catch {}
}

function note(freq, start, dur, { type = "sine", gain = 0.18, slideTo = null } = {}) {
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

const SOUNDS = {
  join: () => { note(660, 0, 0.12); note(990, 0.08, 0.16); },
  start: () => [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.09, 0.22, { type: "triangle" })),
  question: () => { note(880, 0, 0.18, { type: "triangle" }); note(1320, 0.12, 0.3, { type: "triangle", gain: 0.12 }); },
  vote: () => note(420, 0, 0.12, { slideTo: 900, gain: 0.2 }),
  tick: () => note(1500, 0, 0.05, { type: "square", gain: 0.05 }),
  reveal: () => {
    for (let i = 0; i < 8; i++) note(180 + i * 25, i * 0.05, 0.06, { type: "square", gain: 0.04 });
    [523, 659, 784].forEach((f) => note(f, 0.45, 0.6, { type: "triangle", gain: 0.12 }));
  },
  correct: () => { note(988, 0, 0.1, { type: "square", gain: 0.08 }); note(1319, 0.09, 0.3, { type: "square", gain: 0.08 }); },
  wrong: () => note(300, 0, 0.45, { type: "sawtooth", slideTo: 120, gain: 0.08 }),
  final: () => {
    const seq = [523, 523, 523, 659, 784, 659, 784, 1047];
    const times = [0, 0.12, 0.24, 0.4, 0.56, 0.72, 0.84, 1.0];
    seq.forEach((f, i) => note(f, times[i], i === seq.length - 1 ? 0.8 : 0.14, { type: "triangle", gain: 0.14 }));
  }
};

export function play(name) {
  if (muted || !ctx || ctx.state !== "running") return;
  try { SOUNDS[name]?.(); } catch {}
}
