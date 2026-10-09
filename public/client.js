import { GENRES, TONES, MAX_GENRES } from "./genres.js";
import { unlockAudio, play, isMuted, setMuted } from "./sound.js";
import { confetti } from "./confetti.js";
import { makeShareCard } from "./sharecard.js";

const socket = io({ transports: ["websocket", "polling"] });
const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
const offlineEl = document.getElementById("offline");

const SAVE_KEY = "witr-session";
const genreById = new Map(GENRES.map((g) => [g.id, g]));
const toneById = new Map(TONES.map((t) => [t.id, t]));
let state = null;
let screen = null; // { key, update(state), destroy?() }
let joining = false;

addEventListener("pointerdown", unlockAudio);
addEventListener("keydown", unlockAudio);

// ---------- tiny helpers ----------

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastEl.classList.remove("show"), 2800);
}

const COLORS = ["#6d4aff", "#ff4f8b", "#0fa968", "#f59e0b", "#1e88e5", "#e5533d", "#9b51e0", "#00a3a3", "#d81b60", "#6b8e00", "#ff7a00", "#3f51b5"];
// Players get colours in join order so nobody in a room shares one (up to 12).
let colorMap = new Map();
function colorFor(id) {
  if (colorMap.has(id)) return colorMap.get(id);
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[n % COLORS.length];
}
function avatar(p, size = "") {
  const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return h("div", { class: `avatar ${size}`, style: `background:${colorFor(p.id)}` }, initials);
}
const pc = (id) => `--pc:${colorFor(id)}`;

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SAVE_KEY)) || null; } catch { return null; }
}
function saveSession(s) {
  try { s ? sessionStorage.setItem(SAVE_KEY, JSON.stringify(s)) : sessionStorage.removeItem(SAVE_KEY); } catch {}
}
function savedName() {
  try { return localStorage.getItem("witr-name") || ""; } catch { return ""; }
}
function rememberName(n) {
  try { localStorage.setItem("witr-name", n); } catch {}
}

function urlRoom() {
  const q = new URLSearchParams(location.search).get("room");
  return q ? q.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) : "";
}
function inviteLink(code) {
  return `${location.origin}${location.pathname}?room=${code}`;
}

function mount(key, build) {
  if (screen?.key === key) return screen.update(state);
  if (screen?.destroy) screen.destroy();
  app.replaceChildren();
  screen = build();
  screen.key = key;
  screen.update(state);
  window.scrollTo({ top: 0 });
}

function themeLine(settings) {
  const g = settings.genres.map((id) => genreById.get(id)).filter(Boolean);
  const t = toneById.get(settings.tone);
  return [g.length ? g.map((x) => `${x.emoji} ${x.label}`).join(" · ") : "🎲 Random Mix", t ? `${t.emoji} ${t.label}` : null]
    .filter(Boolean)
    .join("  |  ");
}

// ---------- join ----------

function join(payload) {
  if (joining) return;
  joining = true;
  socket.emit("join", payload, (res) => {
    joining = false;
    if (!res?.ok) {
      if (payload.token) {
        // Saved session no longer valid; show the home screen instead.
        saveSession(null);
        renderHome();
      }
      return toast(res?.error || "Could not join.");
    }
    saveSession({ code: res.code, token: res.token });
    if (!payload.create && !payload.token) {
      try { localStorage.setItem("witr-joined", "1"); } catch {}
    }
    history.replaceState(null, "", `?room=${res.code}`);
  });
}

function tryResume() {
  const s = loadSession();
  const code = urlRoom();
  if (s && (!code || code === s.code)) {
    join({ code: s.code, token: s.token });
    return true;
  }
  return false;
}

// ---------- shared pieces ----------

function topbar(s) {
  const muteBtn = h("button", { class: "icon-btn", title: "Sound on/off", "aria-label": "Toggle sound" });
  const paint = () => { muteBtn.textContent = isMuted() ? "🔇" : "🔊"; };
  muteBtn.addEventListener("click", () => { setMuted(!isMuted()); paint(); if (!isMuted()) play("vote"); });
  paint();
  return h("div", { class: "topbar" },
    h("span", { class: "pill code", title: "Room code" }, "👀 ", s.code),
    h("div", { class: "row", style: "gap:6px" },
      muteBtn,
      h("button", {
        class: "btn ghost",
        onclick: () => {
          if (!confirm("Leave this room?")) return;
          socket.emit("leave");
          saveSession(null);
          history.replaceState(null, "", location.pathname);
          renderHome();
        }
      }, "Leave")
    )
  );
}

function playerChip(p, s) {
  return h("div", { class: `player${p.connected ? "" : " off"}`, style: pc(p.id) },
    avatar(p),
    h("div", { style: "min-width:0" },
      h("div", { class: "name", title: p.name }, p.name),
      h("div", { class: "row", style: "gap:4px" },
        p.id === s.hostId ? h("span", { class: "tag" }, "👑 host") : null,
        p.id === s.youId ? h("span", { class: "tag good" }, "you") : null,
        p.connected ? null : h("span", { class: "muted small" }, "offline")
      )
    )
  );
}

function seg(options, current, onPick) {
  return h("div", { class: "seg", role: "radiogroup" }, options.map((o) =>
    h("button", {
      class: o.value === current ? "on" : "",
      role: "radio",
      "aria-checked": String(o.value === current),
      onclick: () => onPick(o.value)
    }, o.label, o.hint ? h("small", {}, o.hint) : null)
  ));
}

function scoreboard(s, limit) {
  const sorted = [...s.players].sort((a, b) => b.score - a.score).slice(0, limit);
  return h("div", { class: "board" }, sorted.map((p, i) =>
    h("div", { class: `line${p.id === s.youId ? " me" : ""}` },
      h("span", { class: "rank" }, i + 1), avatar(p), h("span", {}, p.name), h("span", { class: "score" }, p.score)
    )
  ));
}

// ---------- screens ----------

function renderHome() {
  if (screen?.destroy) screen.destroy();
  screen = null;
  state = null;
  const code = urlRoom();
  const nameInput = h("input", {
    class: "input", id: "name", maxlength: "20", autocomplete: "name",
    placeholder: "e.g. Priya Sharma", value: savedName()
  });
  const codeInput = h("input", { class: "input code", id: "code", maxlength: "4", placeholder: "CODE", value: code, autocapitalize: "characters" });

  const getName = () => {
    const n = nameInput.value.trim();
    if (!n) { toast("Enter your name first."); nameInput.focus(); return null; }
    rememberName(n);
    return n;
  };
  const doJoin = () => {
    const name = getName();
    if (!name) return;
    const c = codeInput.value.trim().toUpperCase();
    if (c.length !== 4) return toast("Room codes have 4 letters.");
    join({ name, code: c });
  };
  const doCreate = () => {
    const name = getName();
    let joinedBefore = false;
    try { joinedBefore = localStorage.getItem("witr-joined") === "1"; } catch {}
    if (name) join({ name, create: true, joinedBefore });
  };
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") (code ? doJoin : doCreate)(); });
  codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doJoin(); });

  const joinBlock = h("div", { class: "stack" },
    h("label", { for: "code" }, "Room code"),
    h("div", { class: "row" }, codeInput, h("button", { class: code ? "btn primary" : "btn", onclick: doJoin }, "Join"))
  );

  app.replaceChildren(
    h("div", { class: "logo" },
      h("span", { class: "emoji", "aria-hidden": "true" }, "👀"),
      h("h1", {}, "Who In The ", h("span", { class: "grad-text" }, "Room")),
      h("p", {}, "Cheeky questions about your group. Guess who the majority picks — the fastest right guess scores the most.")
    ),
    h("div", { class: "how" },
      h("div", {}, h("b", {}, "🙋"), "Everyone joins with their name"),
      h("div", {}, h("b", {}, "🗳️"), "Vote who fits the question"),
      h("div", {}, h("b", {}, "⚡"), "Match the majority, fast")
    ),
    h("div", { class: "card stack" },
      h("label", { for: "name" }, "Your name"),
      nameInput,
      h("p", { class: "muted small", style: "margin:0" }, "Use your real name so friends can vote for you."),
      code
        ? [joinBlock, h("div", { class: "divider" }, "or"), h("button", { class: "btn block", onclick: doCreate }, "Create a new room")]
        : [h("button", { class: "btn primary block", onclick: doCreate }, "🎉 Create a room"), h("div", { class: "divider" }, "or join friends"), joinBlock]
    ),
    h("p", { class: "muted small center" }, "3–20 players · works on phones and laptops · 🔊 sound on")
  );
  nameInput.focus();
}

function lobbyScreen() {
  const playersEl = h("div", { class: "players" });
  const countEl = h("span", { class: "muted small" });
  const settingsArea = h("div", { class: "stack" });
  const codeEl = h("div", { class: "room-code grad-text" });

  const copy = async () => {
    const link = inviteLink(state.code);
    if (navigator.share && matchMedia("(pointer:coarse)").matches) {
      try { await navigator.share({ title: "Who In The Room", text: `Join my game! Code ${state.code}`, url: link }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(link); toast("Invite link copied!"); }
    catch { prompt("Copy this link:", link); }
  };

  app.append(
    topbar(state),
    h("div", { class: "card stack room-hero" },
      h("div", { class: "muted small" }, "Share this code with your group"),
      codeEl,
      h("button", { class: "btn primary", onclick: copy }, "📨 Invite friends")
    ),
    h("div", { class: "card stack" },
      h("div", { class: "row spread" }, h("h3", {}, "Players"), countEl),
      playersEl
    ),
    settingsArea
  );

  let builtFor = null; // "host" | "guest"
  let lastCount = state.players.length;
  let host = null; // host controls, built once
  let guestEl = null;

  function buildHost() {
    const search = h("input", { class: "input", placeholder: "🔍 Search 50 themes…", style: "padding:10px 14px;font-size:.95rem" });
    const chipsEl = h("div", { class: "chips" });
    const pickedEl = h("span", { class: "muted small" });
    const context = h("textarea", {
      class: "input", id: "context", maxlength: "300",
      placeholder: "e.g. 6 college friends back from a Manali trek. Rohan always forgets things, Sneha plans everything."
    });
    const toneEl = h("div");
    const timerEl = h("div");
    const aiNote = h("p", { class: "muted small", style: "margin:0" });
    const startBtn = h("button", { class: "btn primary block", onclick: () => {
      socket.emit("settings", { context: context.value });
      socket.emit("start");
    } });

    let debounce;
    context.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => socket.emit("settings", { context: context.value }), 400);
    });
    search.addEventListener("input", () => paintChips(state));

    function paintChips(s) {
      const chosen = s.settings.genres;
      const q = search.value.trim().toLowerCase();
      const full = chosen.length >= MAX_GENRES;
      const picked = chosen.map((id) => genreById.get(id));
      chipsEl.replaceChildren(...[...picked, ...GENRES.filter((g) => !chosen.includes(g.id))]
        .filter((g) => !q || g.label.toLowerCase().includes(q) || chosen.includes(g.id))
        .map((g) => {
          const on = chosen.includes(g.id);
          return h("button", {
            class: `chip${on ? " on" : ""}`,
            "aria-pressed": String(on),
            disabled: !on && full,
            onclick: () => {
              const next = on ? chosen.filter((x) => x !== g.id) : [...chosen, g.id];
              socket.emit("settings", { genres: next });
            }
          }, g.emoji, " ", g.label);
        }));
      pickedEl.textContent = `${chosen.length}/${MAX_GENRES} picked`;
    }

    settingsArea.replaceChildren(h("div", { class: "card stack" },
      h("h3", {}, "🎛️ Game setup"),
      h("div", { class: "row spread" }, h("span", { class: "label" }, "What kind of questions?"), pickedEl),
      search,
      chipsEl,
      h("label", { for: "context" }, "Tell the AI about your group (optional)"),
      context,
      aiNote,
      h("span", { class: "label" }, "How blunt?"),
      toneEl,
      h("span", { class: "label" }, "Time per question"),
      timerEl,
      startBtn
    ));

    return {
      update(s) {
        paintChips(s);
        if (document.activeElement !== context) context.value = s.settings.context;
        toneEl.replaceChildren(seg(
          TONES.map((t) => ({ value: t.id, label: `${t.emoji} ${t.label}`, hint: t.hint })),
          s.settings.tone,
          (tone) => socket.emit("settings", { tone })
        ));
        timerEl.replaceChildren(seg(
          [15, 20, 30].map((t) => ({ value: t, label: `${t}s` })),
          s.settings.timer,
          (timer) => socket.emit("settings", { timer })
        ));
        aiNote.textContent = s.aiEnabled
          ? "✨ AI writes 10 fresh questions from your themes and description."
          : "Using the built-in questions (AI not set up). Themes still pick matching questions where available.";
        const online = s.players.filter((p) => p.connected).length;
        const enough = online >= s.minPlayers;
        startBtn.disabled = !enough;
        startBtn.textContent = enough
          ? "🚀 Start game (10 questions)"
          : `Need ${s.minPlayers - online} more player${s.minPlayers - online === 1 ? "" : "s"}`;
      }
    };
  }

  return {
    update(s) {
      codeEl.textContent = s.code;
      const online = s.players.filter((p) => p.connected).length;
      countEl.textContent = `${online} online`;
      playersEl.replaceChildren(...s.players.map((p) => playerChip(p, s)));
      if (s.players.length > lastCount) play("join");
      lastCount = s.players.length;

      const role = s.hostId === s.youId ? "host" : "guest";
      if (builtFor !== role) {
        builtFor = role;
        if (role === "host") host = buildHost();
        else {
          guestEl = h("div", { class: "stack" });
          settingsArea.replaceChildren(h("div", { class: "card stack center" }, guestEl));
        }
      }
      if (role === "host") host.update(s);
      else {
        const hostP = s.players.find((p) => p.id === s.hostId);
        guestEl.replaceChildren(
          h("div", { style: "font-size:40px" }, "⏳"),
          h("h3", {}, `Waiting for ${hostP ? hostP.name : "the host"} to start…`),
          h("p", { class: "muted", style: "margin:0" }, themeLine(s.settings)),
          online < s.minPlayers ? h("p", { class: "muted small", style: "margin:0" }, `Need at least ${s.minPlayers} players.`) : null
        );
      }
    }
  };
}

function loadingScreen() {
  const msg = h("p", { class: "muted center", style: "margin:0" });
  const theme = h("p", { class: "center", style: "margin:0;font-weight:600" });
  app.append(h("div", { class: "card stack center", style: "margin-top:18vh" },
    h("div", { class: "spinner" }),
    h("h2", {}, "Cooking up questions…"),
    theme,
    msg
  ));
  play("start");
  return {
    update(s) {
      theme.textContent = themeLine(s.settings);
      msg.textContent = s.aiEnabled ? "The AI is writing questions just for your group." : "Shuffling the deck.";
    }
  };
}

function questionScreen() {
  const s0 = state;
  const q = s0.question;
  const deadline = performance.now() + q.remainingMs;
  const R = 27;
  const C = 2 * Math.PI * R;
  const ringSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ringSvg.setAttribute("viewBox", "0 0 64 64");
  ringSvg.setAttribute("width", "64");
  ringSvg.setAttribute("height", "64");
  ringSvg.innerHTML = `<circle class="track" cx="32" cy="32" r="${R}" fill="none" stroke-width="6"/>
    <circle class="arc" cx="32" cy="32" r="${R}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/>`;
  const arcEl = ringSvg.querySelector(".arc");
  const secsEl = h("b");
  const ring = h("div", { class: "ring" }, ringSvg, secsEl);
  const statusEl = h("p", { class: "muted center", style: "margin:0" });
  const votedEl = h("div", { class: "voted-strip" });
  const buttons = new Map();

  const optionsEl = h("div", { class: "options" }, q.options.map((o) => {
    const b = h("button", {
      class: "option",
      style: pc(o.id),
      onclick: () => {
        if (state.question?.myVote) return;
        b.classList.add("picked");
        for (const other of buttons.values()) other.disabled = true;
        play("vote");
        socket.emit("vote", { targetId: o.id });
      }
    }, avatar(o), h("span", {}, o.name), o.id === s0.youId ? h("span", { class: "tag good" }, "you") : null);
    buttons.set(o.id, b);
    return b;
  }));

  app.append(
    topbar(s0),
    h("div", { class: "qbar" },
      h("div", { class: "info" },
        h("div", { class: "row spread" },
          h("b", {}, `Question ${q.index + 1}/${q.total}`),
          h("span", { class: "muted small theme-mini" }, themeLine(s0.settings).split("  |  ")[0])
        ),
        h("div", { class: "progress" }, Array.from({ length: q.total }, (_, i) =>
          h("i", { class: i < q.index ? "done" : i === q.index ? "now" : "" })))
      ),
      ring
    ),
    h("div", { class: "card question-card" }, h("h2", { class: "question-text" }, q.text)),
    optionsEl,
    statusEl,
    votedEl
  );
  play("question");

  let raf;
  let lastSec = null;
  const tick = () => {
    const left = Math.max(0, deadline - performance.now());
    const sec = Math.ceil(left / 1000);
    arcEl.setAttribute("stroke-dashoffset", String(C * (1 - left / q.durationMs)));
    secsEl.textContent = sec;
    ring.classList.toggle("low", left < 5000);
    if (sec !== lastSec) {
      if (lastSec !== null && sec <= 5 && sec > 0 && !state.question?.myVote) play("tick");
      lastSec = sec;
    }
    if (left > 0) raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    destroy() { cancelAnimationFrame(raf); },
    update(s) {
      const mine = s.question.myVote;
      for (const [id, b] of buttons) {
        b.disabled = Boolean(mine);
        b.classList.toggle("picked", id === mine);
      }
      const online = s.players.filter((p) => p.connected);
      const done = online.filter((p) => p.voted).length;
      statusEl.textContent = mine
        ? `🔒 Locked in! Waiting for others… (${done}/${online.length})`
        : "Who will the group pick? Faster right answers score more!";
      votedEl.replaceChildren(...online.map((p) => h("span", { class: `dot${p.voted ? " done" : ""}` }, (p.voted ? "✓ " : "") + p.name)));
    }
  };
}

function revealScreen() {
  const s = state;
  const r = s.reveal;
  const q = s.question;
  const max = Math.max(1, ...r.tally.map((t) => t.votes));
  const winnerIds = new Set(r.winners.map((w) => w.id));
  const mine = q.myVote;
  const myAward = r.awards.find((a) => a.id === s.youId);

  let verdict;
  if (!r.winners.length) verdict = "Nobody voted!";
  else verdict = r.winners.map((w) => w.name).join(" & ");

  let banner;
  if (myAward) banner = h("div", { class: "result-banner good" }, `🎯 You nailed it! +${myAward.points} points`);
  else if (mine) banner = h("div", { class: "result-banner bad" }, "😬 Not this time — the group thought differently.");
  else banner = h("div", { class: "result-banner none" }, "⌛ You didn't vote on this one.");

  const fills = [];
  const rows = r.tally.filter((t) => t.votes > 0).map((t) => {
    const fill = h("div", { class: "fill" });
    fills.push([fill, (t.votes / max) * 100]);
    return h("div", { class: `vote-row${winnerIds.has(t.id) ? " win" : ""}`, style: pc(t.id) },
      h("div", { class: "head" },
        avatar(t, "sm"),
        h("span", { class: "n" }, winnerIds.has(t.id) ? `👑 ${t.name}` : t.name),
        h("span", { class: "count" }, t.votes)
      ),
      h("div", { class: "track" }, fill),
      h("div", { class: "voters" },
        h("span", { class: "muted small", style: "align-self:center" }, "picked by"),
        t.voters.map((v) => h("span", { class: `voter${v.id === s.youId ? " me" : ""}` }, avatar(v, "sm"), v.id === s.youId ? "You" : v.name))
      )
    );
  });

  const last = q.index + 1 >= q.total;
  app.append(
    topbar(s),
    h("div", { class: "row spread" },
      h("b", {}, `Question ${q.index + 1} of ${q.total}`),
      h("span", { class: "muted small" }, last ? "🏁 Final results next" : "Next question soon…")
    ),
    h("div", { class: "card stack" },
      h("p", { class: "center muted", style: "margin:0;font-weight:500" }, q.text),
      h("div", { class: "winner" },
        h("div", { class: "label" }, r.winners.length > 1 ? "It's a tie!" : "The group says"),
        h("div", { class: "avatars" }, r.winners.map((w) => avatar(w, "lg"))),
        h("div", { class: "who display grad-text" }, verdict)
      ),
      banner
    ),
    h("div", { class: "card stack" },
      h("h3", {}, "🗳️ Who voted for whom"),
      rows.length ? h("div", { class: "votes" }, rows) : h("p", { class: "muted", style: "margin:0" }, "No votes this time."),
      r.noVote.length
        ? h("p", { class: "muted small", style: "margin:0" }, `Didn't vote: ${r.noVote.map((p) => p.name).join(", ")}`)
        : null
    ),
    r.awards.length ? h("div", { class: "card stack" },
      h("h3", {}, "⚡ Fastest right guesses"),
      h("div", { class: "awards" }, r.awards.map((a, i) =>
        h("div", { class: "award" },
          h("span", {}, ["🥇", "🥈", "🥉"][i] || "✅"),
          h("span", { class: "n" }, `${a.id === s.youId ? "You" : a.name} · ${a.seconds}s`),
          h("span", { class: "pts" }, `+${a.points}`)
        )
      ))
    ) : null,
    h("div", { class: "card stack" }, h("h3", {}, "🏆 Leaderboard"), scoreboard(s, 5))
  );

  requestAnimationFrame(() => requestAnimationFrame(() => fills.forEach(([el, w]) => { el.style.width = `${w}%`; })));
  play("reveal");
  const t = setTimeout(() => {
    if (myAward) { play("correct"); confetti(90); }
    else if (mine) play("wrong");
  }, 650);
  return { update() {}, destroy() { clearTimeout(t); } };
}

// Result card players can post to Instagram stories / WhatsApp status.
function shareCardBlock(s) {
  const img = h("img", { class: "share-preview", alt: "Your result card" });
  const shareBtn = h("button", { class: "btn primary" }, "📸 Share result card");
  const saveBtn = h("button", { class: "btn" }, "⬇️ Save image");
  let blobPromise = null;
  const getBlob = () => (blobPromise ??= makeShareCard({ ...s.final, youId: s.youId }));

  getBlob().then((blob) => { if (blob) img.src = URL.createObjectURL(blob); });

  const save = async () => {
    const blob = await getBlob();
    const a = h("a", { href: URL.createObjectURL(blob), download: "who-in-the-room.png" });
    document.body.append(a);
    a.click();
    a.remove();
  };
  saveBtn.addEventListener("click", save);
  shareBtn.addEventListener("click", async () => {
    const blob = await getBlob();
    const file = new File([blob], "who-in-the-room.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `Our Who In The Room results 😂 Play: ${location.origin}` });
      } catch {}
    } else {
      await save();
      toast("Image saved — post it to your story or group!");
    }
  });

  return h("div", { class: "card stack center" },
    h("h3", {}, "📸 Show off the results"),
    img,
    h("div", { class: "share-actions" }, shareBtn, saveBtn)
  );
}

function finalScreen() {
  const s = state;
  const board = s.final.leaderboard;
  const isHost = s.hostId === s.youId;
  const top = board[0];
  const tied = board.filter((p) => p.score === top?.score && top.score > 0);

  const spot = (p, place) => p
    ? h("div", { class: `spot p${place}` },
        avatar(p, place === 1 ? "lg" : ""),
        h("span", { class: "name", title: p.name }, p.id === s.youId ? "You" : p.name),
        h("span", { class: "pts" }, `${p.score} pts`),
        h("div", { class: "block" }, place)
      )
    : h("div");

  app.append(
    topbar(s),
    h("div", { class: "card stack center" },
      h("div", { style: "font-size:52px" }, "🏆"),
      h("div", { class: "muted", style: "font-weight:600" }, tied.length > 1 ? "Joint winners" : "Winner of the round"),
      h("div", { class: "display grad-text", style: "font-size:clamp(2rem,9vw,2.8rem)" },
        tied.length ? tied.map((p) => p.name).join(" & ") : "No one scored!"),
      h("div", { class: "podium" }, spot(board[1], 2), spot(board[0], 1), spot(board[2], 3))
    ),
    board.length > 3 ? h("div", { class: "card stack" },
      h("h3", {}, "Everyone else"),
      h("div", { class: "board" }, board.slice(3).map((p, i) =>
        h("div", { class: `line${p.id === s.youId ? " me" : ""}` },
          h("span", { class: "rank" }, i + 4), avatar(p), h("span", {}, p.name), h("span", { class: "score" }, p.score)
        )
      ))
    ) : null,
    shareCardBlock(s),
    isHost
      ? h("div", { class: "stack" },
          h("button", { class: "btn primary block", onclick: () => socket.emit("start") }, "🔁 Play another round (new questions)"),
          h("button", { class: "btn block", onclick: () => socket.emit("toLobby") }, "🎛️ Change themes in the lobby")
        )
      : h("p", { class: "muted center" }, "Waiting for the host to start another round…")
  );
  play("final");
  confetti(220);
  return { update() {} };
}

// ---------- wiring ----------

socket.on("state", (s) => {
  state = s;
  // Keep existing colours stable; give newcomers the next unused colour.
  for (const p of s.players) {
    if (colorMap.has(p.id)) continue;
    const used = new Set(colorMap.values());
    colorMap.set(p.id, COLORS.find((c) => !used.has(c)) ?? COLORS[colorMap.size % COLORS.length]);
  }
  switch (s.phase) {
    case "lobby": return mount("lobby", lobbyScreen);
    case "loading": return mount("loading", loadingScreen);
    // Keyed by index: a new question gets a fresh screen, the same one just updates.
    case "question": return mount(`q${s.question.index}`, questionScreen);
    case "reveal": return mount(`r${s.question.index}`, revealScreen);
    case "final": return mount("final", finalScreen);
  }
});

socket.on("connect", () => {
  offlineEl.hidden = true;
  if (state) tryResume(); // reconnect after a drop
});
socket.on("disconnect", () => { if (state) offlineEl.hidden = false; });

if (!tryResume()) renderHome();
