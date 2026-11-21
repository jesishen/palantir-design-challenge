// ─────────────────────────────────────────────
// Break Buddy
// Flow: pick work length → work → pick break length + idea → break → repeat
// ─────────────────────────────────────────────

// ===== Config =====
const TEST_MODE = false;               // shows a "10" button = 10 seconds. Set to false to remove.
const WORK_OPTIONS = [50, 90, 120];   // minutes
const BREAK_OPTIONS = [5, 10, 15, 20, 25, 30];
const MIN = 60000;

// Break ideas, grouped by break length. 3 are shown at random from the matching group.
const IDEAS = {
  5: [
    { emoji: "🧘", title: "Quick stretch", desc: "Neck rolls, shoulder shrugs, reach up high." },
    { emoji: "💧", title: "Refill your water", desc: "Walk to the kitchen and drink a full glass." },
    { emoji: "🪟", title: "Look far away", desc: "Find the farthest thing out a window and rest your eyes." },
    { emoji: "🌬️", title: "Box breathing", desc: "In 4, hold 4, out 4, hold 4. Repeat." },
    { emoji: "💬", title: "Text a friend", desc: "Reply to that message you've been sitting on." },
  ],
  10: [
    { emoji: "🍵", title: "Make a drink slowly", desc: "Tea, matcha, coffee. The slow way." },
    { emoji: "💃", title: "Dance to 2 songs", desc: "Put on songs you love and just move." },
    { emoji: "🧹", title: "Tidy one spot", desc: "Desk, sink, or one shelf. Small win." },
    { emoji: "✏️", title: "Doodle", desc: "Draw what's in front of you. No undo." },
    { emoji: "🐾", title: "Pets & plants", desc: "Pet your pet, water your plants." },
  ],
  15: [
    { emoji: "🚶", title: "Walk around the block", desc: "Leave your phone if you can." },
    { emoji: "📖", title: "Read for fun", desc: "A few pages of something not work." },
    { emoji: "📞", title: "Call someone", desc: "Quick catch-up with family or a friend." },
    { emoji: "🧘", title: "Full stretch routine", desc: "Floor stretches: hips, back, hamstrings." },
  ],
  20: [
    { emoji: "😴", title: "Power nap", desc: "Lie down with an alarm. Short and sweet." },
    { emoji: "☀️", title: "Sit outside", desc: "Get some sunlight and fresh air." },
    { emoji: "🥗", title: "Snack + sit", desc: "Eat something away from your desk." },
    { emoji: "🎨", title: "Make something", desc: "Sketch, craft, or play an instrument." },
  ],
  25: [
    { emoji: "🍳", title: "Make a small meal", desc: "Cook something simple and eat it slowly." },
    { emoji: "🏃", title: "Quick workout", desc: "A short run, yoga video, or bodyweight set." },
    { emoji: "🌳", title: "Longer walk", desc: "Pick a direction and wander." },
    { emoji: "🛁", title: "Shower reset", desc: "Fresh shower, fresh brain." },
  ],
  30: [
    { emoji: "🍽️", title: "Real meal", desc: "Cook or heat up a proper lunch. No screens." },
    { emoji: "🌲", title: "Go to a park", desc: "Sit somewhere green until the timer's up." },
    { emoji: "🧺", title: "Knock out a chore", desc: "Laundry, dishes, groceries. Brain off." },
    { emoji: "🎮", title: "Play a game", desc: "One round of something fun, then stop." },
  ],
};

// ===== State =====
const STORE_KEY = "breakbuddy:v2";
const defaults = {
  screen: "pickWork",
  workPick: null,                  // ms chosen on pickWork screen
  breakPick: null,                 // { ms, group } chosen on pickBreak screen
  ideas: [], ideaPick: null,       // the 3 shown ideas + which one was picked
  activity: null,
  note: "",
  startedAt: null, endAt: null,
  today: { date: todayStr(), sessions: 0 },
};
let state = load();

function todayStr() { return new Date().toISOString().slice(0, 10); }
function load() {
  try {
    const s = { ...defaults, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
    if (s.today?.date !== todayStr()) s.today = { date: todayStr(), sessions: 0 };
    return s;
  } catch { return { ...defaults }; }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }
function set(patch) { state = { ...state, ...patch }; save(); render(); }

// ===== Helpers =====
const $ = (id) => document.getElementById(id);
const minutesLeft = (ms) => (ms < MIN ? "<1" : String(Math.ceil(ms / MIN)));
const pick3 = (arr) => [...arr].sort(() => Math.random() - 0.5).slice(0, 3);

function pillOptions(minutesList) {
  const opts = minutesList.map((m) => ({ label: m, ms: m * MIN, group: m }));
  if (TEST_MODE) opts.unshift({ label: 10, ms: 10000, group: minutesList[0], test: true });
  return opts;
}
function pillsHTML(opts, selectedMs) {
  return opts.map((o, i) =>
    `<button class="pill ${o.test ? "test" : ""} ${o.ms === selectedMs ? "selected" : ""}" data-i="${i}"
      title="${o.test ? "Test: 10 seconds" : o.label + " minutes"}">${o.label}${o.test ? "s" : "m"}</button>`).join("");}

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.18;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.9);
    });
  } catch {}
}
function notify(title, body) {
  chime();
  if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body, silent: true });
}

// ===== 1. Pick work =====
const workOpts = pillOptions(WORK_OPTIONS);
$("workPills").addEventListener("click", (e) => {
  const p = e.target.closest(".pill"); if (!p) return;
  set({ workPick: workOpts[p.dataset.i].ms });
});
$("startWorkBtn").addEventListener("click", () => {
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  const now = Date.now();
  set({ screen: "work", startedAt: now, endAt: now + state.workPick, note: "", workPick: null });
});

// ===== 2. Work =====
$("breakNowBtn").addEventListener("click", () => goPickBreak());
function goPickBreak() {
  set({ screen: "pickBreak", endAt: null, breakPick: null, ideas: [], ideaPick: null });
}

// ===== 3. Pick break =====
const breakOpts = pillOptions(BREAK_OPTIONS);
$("noteInput").addEventListener("input", (e) => { state.note = e.target.value; save(); });
$("breakPills").addEventListener("click", (e) => {
  const p = e.target.closest(".pill"); if (!p) return;
  const o = breakOpts[p.dataset.i];
  set({ breakPick: { ms: o.ms, group: o.group }, ideas: pick3(IDEAS[o.group]), ideaPick: null });
});
$("shuffleBtn").addEventListener("click", () => {
  if (state.breakPick) set({ ideas: pick3(IDEAS[state.breakPick.group]), ideaPick: null });
});
$("suggestions").addEventListener("click", (e) => {
  const s = e.target.closest(".suggestion"); if (!s) return;
  const i = +s.dataset.i;
  set({ ideaPick: state.ideaPick === i ? null : i });   // click again to unselect
});
$("startBreakBtn").addEventListener("click", () => {
  const now = Date.now();
  const activity = state.ideaPick != null ? state.ideas[state.ideaPick]
    : { emoji: "🌈", title: "Enjoy your break!", desc: "Step away from the screen." };
  set({ screen: "break", activity, startedAt: now, endAt: now + state.breakPick.ms });
});

// ===== 4. Break =====
$("backEarlyBtn").addEventListener("click", () => {
  document.querySelectorAll("#checklist input").forEach((c) => (c.checked = false));
  $("nextWorkBtn").disabled = true;
  set({ screen: "checkBreak" });             // the timer keeps running
});
$("checklist").addEventListener("change", () => {
  const allChecked = [...document.querySelectorAll("#checklist input")].every((c) => c.checked);
  $("nextWorkBtn").disabled = !allChecked;
});
$("resumeBreakBtn").addEventListener("click", () => set({ screen: "break" }));
$("nextWorkBtn").addEventListener("click", () => finishBreak());

function finishBreak() {
  set({ screen: "pickWork", endAt: null, workPick: null });
}

// ===== Timer =====
function tick() {
  if (!state.endAt) { document.title = "Break Buddy"; return; }
  const left = state.endAt - Date.now();
  const pct = Math.min(100, ((Date.now() - state.startedAt) / (state.endAt - state.startedAt)) * 100);

  if (state.screen === "work") {
    $("workTimer").textContent = minutesLeft(left);
    document.title = `⏳ ${minutesLeft(left)} min · Focus`;
    if (left <= 0) { notify("Time for a break 🌿", "Jot where you are, then step away."); goPickBreak(); }
  } else if (state.screen === "break" || state.screen === "checkBreak") {
    $("checkLeft").textContent = minutesLeft(left);
    $("breakTimer").textContent = minutesLeft(left);
    $("breakBar").style.width = pct + "%";
    document.title = `☕ ${minutesLeft(left)} min · Break`;
    if (left <= 0) { notify("Break's over 👋", state.note ? `You were: ${state.note}` : "Ready to lock in?"); finishBreak(); }
  }
}
setInterval(tick, 1000);

// ===== Render =====
let lastMode = null;
function render() {
  const big = ["pickBreak", "break", "checkBreak"].includes(state.screen);
  document.body.classList.toggle("is-overlay", !!window.overlay);
  document.body.classList.toggle("big", big);
  document.body.classList.toggle("working", state.screen === "work");
  const mode = big ? "break" : "mini";
  if (mode !== lastMode) { window.overlay?.setMode(mode); lastMode = mode; }

  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.dataset.screen === state.screen));

  if (state.screen === "pickWork") {
    $("workPills").innerHTML = pillsHTML(workOpts, state.workPick);
    $("startWorkBtn").disabled = !state.workPick;
    $("crumbCard").hidden = !state.note.trim();
    $("crumbText").textContent = state.note.trim();
  }
  if (state.screen === "pickBreak") {
    if (document.activeElement !== $("noteInput")) $("noteInput").value = state.note;
    $("breakPills").innerHTML = pillsHTML(breakOpts, state.breakPick?.ms);
    $("ideasWrap").hidden = !state.breakPick;
    $("suggestions").innerHTML = state.ideas.map((b, i) => `
      <button class="suggestion ${i === state.ideaPick ? "selected" : ""}" data-i="${i}">
        <span class="emoji">${b.emoji}</span><strong>${b.title}</strong><p>${b.desc}</p>
      </button>`).join("");
    $("startBreakBtn").disabled = !state.breakPick;
  }
  if (state.screen === "break" && state.activity) {
    const a = state.activity;
    $("activityCard").innerHTML = `<div class="emoji">${a.emoji}</div><h2>${a.title}</h2><p>${a.desc}</p>`;
  }
  tick();

  // Electron: shrink/grow the small window to fit its content (no scrollbar)
  if (!big && window.overlay?.resize) {
    const w = state.screen === "work" ? 200 : 320;
    requestAnimationFrame(() => window.overlay.resize(w, $("app").offsetHeight));
  }
}

render();
