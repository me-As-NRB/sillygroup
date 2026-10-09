(() => {
  const socket = io({ transports: ["websocket", "polling"] });
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const offlineEl = document.getElementById("offline");

  const SAVE_KEY = "witr-session";
  let state = null;
  let screen = null; // { key, update(state) }
  let joining = false;

  // ---------- tiny helpers ----------

  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "text") el.textContent = v;
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

  const COLORS = ["#6d4aff", "#ff5d8f", "#14a46c", "#f5a524", "#1e88e5", "#e5533d", "#8e44ad", "#00a3a3", "#d81b60", "#5d7b00"];
  function colorFor(id) {
    let n = 0;
    for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    return COLORS[n % COLORS.length];
  }
  function avatar(p) {
    const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return h("div", { class: "avatar", style: `background:${colorFor(p.id)}` }, initials);
  }

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
    const codeInput = h("input", { class: "input code", maxlength: "4", placeholder: "CODE", value: code, autocapitalize: "characters" });

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
      if (name) join({ name, create: true });
    };
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") (code ? doJoin : doCreate)(); });
    codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doJoin(); });

    const joinBlock = h("div", { class: "stack" },
      h("label", { for: "code" }, "Room code"),
      h("div", { class: "row" }, codeInput, h("button", { class: code ? "btn primary" : "btn", onclick: doJoin }, "Join"))
    );
    codeInput.id = "code";

    app.replaceChildren(
      h("div", { class: "logo" },
        h("span", { class: "emoji", "aria-hidden": "true" }, "👀"),
        h("h1", {}, "Who In The ", h("span", {}, "Room")),
        h("p", {}, "Answer cheeky questions about your group. Guess what the majority picks — fastest right guess scores the most.")
      ),
      h("div", { class: "card stack" },
        h("label", { for: "name" }, "Your name"),
        nameInput,
        h("p", { class: "muted small", style: "margin:0" }, "Use your real name so friends can vote for you."),
        code
          ? [joinBlock, h("div", { class: "divider" }, "or"), h("button", { class: "btn block", onclick: doCreate }, "Create a new room")]
          : [h("button", { class: "btn primary block", onclick: doCreate }, "Create a room"), h("div", { class: "divider" }, "or join friends"), joinBlock]
      ),
      h("p", { class: "muted small center" }, "Needs at least 3 players. Works on phones and laptops.")
    );
    nameInput.focus();
  }

  function playerChip(p, s) {
    return h("div", { class: `player${p.connected ? "" : " off"}` },
      avatar(p),
      h("div", { style: "min-width:0" },
        h("div", { class: "name", title: p.name }, p.name),
        h("div", { class: "row", style: "gap:4px" },
          p.id === s.hostId ? h("span", { class: "tag" }, "host") : null,
          p.id === s.youId ? h("span", { class: "tag good" }, "you") : null,
          p.connected ? null : h("span", { class: "muted small" }, "offline")
        )
      )
    );
  }

  function leaveButton() {
    return h("button", {
      class: "btn ghost",
      onclick: () => {
        if (!confirm("Leave this room?")) return;
        socket.emit("leave");
        saveSession(null);
        history.replaceState(null, "", location.pathname);
        renderHome();
      }
    }, "Leave");
  }

  function lobbyScreen() {
    const playersEl = h("div", { class: "players" });
    const countEl = h("span", { class: "muted small" });
    const hostArea = h("div", { class: "stack" });
    let themeInput, timerSelect, startBtn, waitingEl, aiNote;

    const copy = async () => {
      const link = inviteLink(state.code);
      if (navigator.share && matchMedia("(pointer:coarse)").matches) {
        try { await navigator.share({ title: "Who In The Room", text: `Join my game! Code ${state.code}`, url: link }); return; } catch {}
      }
      try { await navigator.clipboard.writeText(link); toast("Invite link copied!"); }
      catch { prompt("Copy this link:", link); }
    };

    const codeEl = h("div", { class: "room-code" });
    app.append(
      h("div", { class: "row spread" }, h("h2", {}, "Lobby"), leaveButton()),
      h("div", { class: "card stack center" },
        h("div", { class: "muted small" }, "Room code"),
        codeEl,
        h("button", { class: "btn primary", onclick: copy }, "Invite friends")
      ),
      h("div", { class: "card stack" },
        h("div", { class: "row spread" }, h("h3", {}, "Players"), countEl),
        playersEl
      ),
      hostArea
    );

    let builtFor = null; // "host" | "guest"
    return {
      update(s) {
        codeEl.textContent = s.code;
        const online = s.players.filter((p) => p.connected).length;
        countEl.textContent = `${online} online`;
        playersEl.replaceChildren(...s.players.map((p) => playerChip(p, s)));

        const isHost = s.hostId === s.youId;
        const role = isHost ? "host" : "guest";
        if (builtFor !== role) {
          builtFor = role;
          if (isHost) {
            themeInput = h("input", {
              class: "input", maxlength: "80", id: "theme",
              placeholder: "e.g. office team, college gang, cousins",
              onchange: () => socket.emit("settings", { theme: themeInput.value })
            });
            timerSelect = h("select", {
              class: "input", id: "timer",
              onchange: () => socket.emit("settings", { timer: Number(timerSelect.value) })
            }, [15, 20, 30].map((t) => h("option", { value: t }, `${t} seconds`)));
            startBtn = h("button", { class: "btn primary block", onclick: () => {
              socket.emit("settings", { theme: themeInput.value });
              socket.emit("start");
            } }, "Start game");
            aiNote = h("p", { class: "muted small", style: "margin:0" });
            hostArea.replaceChildren(h("div", { class: "card stack" },
              h("h3", {}, "Game settings"),
              h("label", { for: "theme" }, "Who's playing? (optional)"),
              themeInput,
              aiNote,
              h("label", { for: "timer" }, "Time per question"),
              timerSelect,
              startBtn
            ));
            themeInput.value = s.settings.theme;
          } else {
            waitingEl = h("p", { class: "muted center", style: "margin:0" });
            hostArea.replaceChildren(h("div", { class: "card stack" }, waitingEl));
          }
        }

        if (isHost) {
          timerSelect.value = String(s.settings.timer);
          aiNote.textContent = s.aiEnabled
            ? "AI writes 10 fresh questions for your group each round."
            : "Using the built-in question list (AI not configured).";
          const enough = online >= s.minPlayers;
          startBtn.disabled = !enough;
          startBtn.textContent = enough ? "Start game (10 questions)" : `Need ${s.minPlayers - online} more player${s.minPlayers - online === 1 ? "" : "s"}`;
        } else {
          const host = s.players.find((p) => p.id === s.hostId);
          waitingEl.textContent = `Waiting for ${host ? host.name : "the host"} to start…` +
            (online < s.minPlayers ? ` (need at least ${s.minPlayers} players)` : "");
        }
      }
    };
  }

  function loadingScreen() {
    const msg = h("p", { class: "muted center", style: "margin:0" });
    app.append(h("div", { class: "card stack center", style: "margin-top:20vh" },
      h("div", { class: "spinner" }),
      h("h2", {}, "Cooking up questions…"),
      msg
    ));
    return { update(s) { msg.textContent = s.aiEnabled ? "The AI is writing questions just for your group." : "Shuffling the deck."; } };
  }

  function questionScreen() {
    const s0 = state;
    const q = s0.question;
    const deadline = performance.now() + q.remainingMs;
    const bar = h("div");
    const timerEl = h("div", { class: "timer" }, bar);
    const secsEl = h("span");
    const statusEl = h("p", { class: "muted center", style: "margin:0" });
    const votedEl = h("div", { class: "voted-strip" });
    const buttons = new Map();

    const optionsEl = h("div", { class: "options" }, q.options.map((o) => {
      const b = h("button", {
        class: "option",
        onclick: () => {
          if (state.question?.myVote) return;
          b.classList.add("picked");
          for (const other of buttons.values()) other.disabled = true;
          socket.emit("vote", { targetId: o.id });
        }
      }, avatar(o), h("span", {}, o.name), o.id === s0.youId ? h("span", { class: "tag good" }, "you") : null);
      buttons.set(o.id, b);
      return b;
    }));

    app.append(
      h("div", { class: "qhead" }, h("span", {}, `Question ${q.index + 1} / ${q.total}`), secsEl),
      timerEl,
      h("div", { class: "card stack" }, h("h2", { class: "question-text" }, q.text), optionsEl),
      statusEl,
      votedEl
    );

    let raf;
    const tick = () => {
      const left = Math.max(0, deadline - performance.now());
      bar.style.transform = `scaleX(${left / q.durationMs})`;
      secsEl.textContent = `${Math.ceil(left / 1000)}s`;
      timerEl.classList.toggle("low", left < 5000);
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
          ? `Locked in! Waiting for others… (${done}/${online.length})`
          : "Pick who the group will vote for. Faster right answers score more!";
        votedEl.replaceChildren(...online.map((p) => h("span", { class: `dot${p.voted ? " done" : ""}` }, (p.voted ? "✓ " : "") + p.name)));
      }
    };
  }

  function scoreboard(s, limit) {
    const sorted = [...s.players].sort((a, b) => b.score - a.score).slice(0, limit);
    return h("div", { class: "board" }, sorted.map((p, i) =>
      h("div", { class: `line${p.id === s.youId ? " me" : ""}` },
        h("span", { class: "rank" }, i + 1), avatar(p), h("span", {}, p.name), h("span", { class: "score" }, p.score)
      )
    ));
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
    else if (r.winners.length === 1) verdict = r.winners[0].name;
    else verdict = r.winners.map((w) => w.name).join(" & ");

    let personal;
    if (myAward) personal = h("p", { class: "center", style: "margin:0;font-weight:600;color:var(--good)" }, `You got it! +${myAward.points} points`);
    else if (mine) personal = h("p", { class: "center muted", style: "margin:0" }, "Not this time — the group thought differently.");
    else personal = h("p", { class: "center muted", style: "margin:0" }, "You didn't vote on this one.");

    const last = q.index + 1 >= q.total;
    app.append(
      h("div", { class: "qhead" }, h("span", {}, `Question ${q.index + 1} / ${q.total}`), h("span", {}, last ? "Final results next" : "Next question soon…")),
      h("div", { class: "card stack" },
        h("p", { class: "center muted", style: "margin:0" }, q.text),
        h("div", { class: "winner" }, h("div", { class: "label" }, r.winners.length > 1 ? "It's a tie!" : "The group says"), h("div", { class: "who display" }, verdict)),
        personal
      ),
      h("div", { class: "card stack" },
        h("h3", {}, "Votes"),
        h("div", { class: "bars" }, r.tally.map((t) =>
          h("div", { class: `bar${winnerIds.has(t.id) ? " win" : ""}` },
            h("span", { class: "n", title: t.name }, t.name),
            h("div", { class: "track" }, h("div", { class: "fill", style: `width:${(t.votes / max) * 100}%` })),
            h("span", {}, t.votes)
          )
        ))
      ),
      r.awards.length ? h("div", { class: "card stack" },
        h("h3", {}, "Fastest right guesses"),
        h("div", { class: "awards" }, r.awards.map((a) =>
          h("div", { class: "award" }, h("span", {}, `${a.name} · ${a.seconds}s`), h("span", { class: "pts" }, `+${a.points}`))
        ))
      ) : null,
      h("div", { class: "card stack" }, h("h3", {}, "Leaderboard"), scoreboard(s, 5))
    );
    return { update() {} };
  }

  function finalScreen() {
    const s = state;
    const board = s.final.leaderboard;
    const isHost = s.hostId === s.youId;
    const medals = ["🥇", "🥈", "🥉"];
    const top = board[0];
    const tied = board.filter((p) => p.score === top?.score && top.score > 0);

    app.append(
      h("div", { class: "row spread" }, h("h2", {}, "Round over!"), leaveButton()),
      h("div", { class: "card stack center" },
        h("div", { style: "font-size:56px" }, "🏆"),
        h("div", { class: "muted" }, tied.length > 1 ? "Joint winners" : "Winner"),
        h("div", { class: "display", style: "font-size:clamp(1.8rem,8vw,2.6rem);color:var(--accent)" },
          tied.length ? tied.map((p) => p.name).join(" & ") : "No one scored!")
      ),
      h("div", { class: "card stack" },
        h("h3", {}, "Final scores"),
        h("div", { class: "board" }, board.map((p, i) =>
          h("div", { class: `line${p.id === s.youId ? " me" : ""}` },
            h("span", { class: "rank" }, medals[i] ? h("span", { class: "podium-emoji" }, medals[i]) : i + 1),
            avatar(p), h("span", {}, p.name), h("span", { class: "score" }, p.score)
          )
        ))
      ),
      isHost
        ? h("div", { class: "stack" },
            h("button", { class: "btn primary block", onclick: () => socket.emit("start") }, "Play another round (new questions)"),
            h("button", { class: "btn block", onclick: () => socket.emit("toLobby") }, "Back to lobby")
          )
        : h("p", { class: "muted center" }, "Waiting for the host to start another round…")
    );
    return { update() {} };
  }

  // ---------- wiring ----------

  socket.on("state", (s) => {
    const prev = state;
    state = s;
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
})();
