/*
 * A11 Presentation Demo - page code (CS456)
 * Splitting boxes, in order, into k groups so the heaviest group is as light as possible.
 *
 * Sections:
 *   1. Core algorithms: bruteForce, dpSolve, binarySearch (+ pack, splitToK, checkSplit, comb)
 *   2. Shared input parsing and validation
 *   3. Tab 1 Try it, Tab 2 Brute force, Tab 3 DP table, Tab 4 Binary search
 *   4. Step engine (Back / Next / Play / Restart, arrow keys) and tab switching
 *
 * This is the same script that is embedded in a11_demo.html (the demo stays a single offline file).
 * The core algorithms are also exposed as window.A11 for checking in the browser console.
 * The page was built with AI help (Claude). Our graded implementation is the Python code.
 */
"use strict";
/* ============ core algorithms (must match the Python reference) ============ */
function prefix(w) { const p = [0]; for (const x of w) p.push(p[p.length - 1] + x); return p; }
function cutsToGroups(n, cuts) {
  const gs = []; let prev = 0;
  for (const c of [...cuts, n]) { const g = []; for (let i = prev; i < c; i++) g.push(i); gs.push(g); prev = c; }
  return gs;
}
function groupSum(w, g) { let s = 0; for (const i of g) s += w[i]; return s; }
function heaviest(w, gs) { return Math.max(...gs.map(g => groupSum(w, g))); }

function bruteForce(w, k, wantAll) {
  const n = w.length, pre = prefix(w);
  let best = Infinity, bestCuts = null, count = 0;
  const all = [], cuts = [];
  (function rec(start, remaining) {
    if (remaining === 0) {
      count++;
      let prev = 0, mx = 0;
      for (const c of [...cuts, n]) { mx = Math.max(mx, pre[c] - pre[prev]); prev = c; }
      if (wantAll) all.push({ cuts: cuts.slice(), max: mx });
      if (mx < best) { best = mx; bestCuts = cuts.slice(); }
      return;
    }
    for (let c = start + 1; c <= n - remaining; c++) { cuts.push(c); rec(c, remaining - 1); cuts.pop(); }
  })(0, k - 1);
  return { answer: best, groups: cutsToGroups(n, bestCuts), count, all };
}

function dpSolve(w, k) {
  const n = w.length, pre = prefix(w);
  const dp = [], ch = [];
  for (let j = 0; j <= k; j++) { dp.push(new Array(n + 1).fill(Infinity)); ch.push(new Array(n + 1).fill(-1)); }
  dp[0][0] = 0;
  for (let i = 1; i <= n; i++) { dp[1][i] = pre[i]; ch[1][i] = 0; }
  for (let j = 2; j <= k; j++)
    for (let i = j; i <= n; i++)
      for (let p = j - 1; p <= i - 1; p++) {
        const c = Math.max(dp[j - 1][p], pre[i] - pre[p]);
        if (c < dp[j][i]) { dp[j][i] = c; ch[j][i] = p; }
      }
  const cuts = []; let i = n;
  for (let j = k; j >= 2; j--) { i = ch[j][i]; cuts.unshift(i); }
  return { answer: dp[k][n], groups: cutsToGroups(n, cuts), dp, ch, pre };
}

function pack(w, limit) {  // greedy: a box joins the current bag if it fits, else opens a new bag
  const bags = [[]]; let cur = 0;
  for (let i = 0; i < w.length; i++) {
    if (bags[bags.length - 1].length && cur + w[i] > limit) { bags.push([]); cur = 0; }
    bags[bags.length - 1].push(i); cur += w[i];
  }
  return bags;
}
function splitToK(bags, k) {  // split bags (never heavier) until there are exactly k groups
  const out = bags.map(b => b.slice()), splits = [];
  while (out.length < k) {
    let b = out.length - 1; while (out[b].length < 2) b--;
    const moved = out[b].pop();
    out.splice(b + 1, 0, [moved]);
    splits.push({ from: b, moved, snapshot: out.map(x => x.slice()) });
  }
  return { groups: out, splits };
}
function binarySearch(w, k) {
  let lo = Math.max(...w), hi = w.reduce((a, b) => a + b, 0);
  const rounds = [];
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const bags = pack(w, mid), pass = bags.length <= k;
    const r = { lo, hi, guess: mid, bags, pass };
    if (pass) hi = mid; else lo = mid + 1;
    r.newLo = lo; r.newHi = hi; rounds.push(r);
  }
  const finalBags = pack(w, lo), sk = splitToK(finalBags, k);
  return { answer: lo, rounds, finalBags, splits: sk.splits, groups: sk.groups };
}

function checkSplit(w, k, groups, answer) {
  if (groups.length !== k) return { ok: false, why: `${groups.length} groups, not ${k}` };
  if (groups.some(g => g.length === 0)) return { ok: false, why: "a group is empty" };
  const flat = groups.flat();
  if (flat.length !== w.length || flat.some((v, i) => v !== i)) return { ok: false, why: "boxes missing or out of order" };
  if (heaviest(w, groups) !== answer) return { ok: false, why: "heaviest group ≠ answer" };
  return { ok: true, why: "k groups, in order" };
}

function comb(n, r) {  // exact, BigInt
  if (r < 0 || r > n) return 0n;
  r = Math.min(r, n - r); let res = 1n;
  for (let i = 1; i <= r; i++) res = res * BigInt(n - r + i) / BigInt(i);
  return res;
}

/* ============ helpers ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = x => typeof x === "bigint" ? x.toLocaleString("en-US") : Number(x).toLocaleString("en-US");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const GC = ["--g1", "--g2"];  // groups alternate black / red, always labelled G1, G2, ...
const gcol = g => `var(${GC[g % GC.length]})`;
const list = (w, idx) => "[" + idx.map(i => w[i]).join(", ") + "]";

function boxHTML(v, cls = "") { return `<span class="box ${cls}">${v}</span>`; }
function groupsHTML(w, groups) {
  const sums = groups.map(g => groupSum(w, g)), mx = Math.max(...sums);
  let heavyDone = false;
  return `<div class="groups">` + groups.map((g, gi) => {
    const heavy = sums[gi] === mx && !heavyDone; if (heavy) heavyDone = true;
    return `<div class="grp${heavy ? " heavy" : ""}" style="--gc:${gcol(gi)}"><div class="gh">G${gi + 1}</div>
      <div class="gb">${g.map(i => boxHTML(w[i])).join("")}</div><div class="gt num">= ${sums[gi]}</div></div>`;
  }).join("") + `</div>`;
}

/* ============ shared input ============ */
const DEFAULT_W = "7, 2, 5, 10, 8", DEFAULT_K = "2";
const MAX_N = 200;
let S = { ok: true, w: [7, 2, 5, 10, 8], k: 2 };

function parseInput(raw, kraw) {
  const t = raw.trim();
  if (!t) return { ok: false, msg: "The box list is empty. Type weights separated by commas, for example 7, 2, 5." };
  let parts = t.split(",").map(s => s.trim());
  if (parts[parts.length - 1] === "") parts.pop();
  const w = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === "") return { ok: false, msg: `Entry ${i + 1} is empty. Remove the extra comma.` };
    if (!/^\d+$/.test(p)) return { ok: false, msg: `“${esc(p)}” is not a whole number. Weights must be positive whole numbers, for example 7, 2, 5.` };
    const v = Number(p);
    if (v < 1) return { ok: false, msg: `Box ${i + 1} weighs ${v}. Every weight must be a positive whole number (1 or more).` };
    if (!Number.isSafeInteger(v)) return { ok: false, msg: `Box ${i + 1} is too large.` };
    w.push(v);
  }
  if (w.length > MAX_N) return { ok: false, msg: `That is ${w.length} boxes. This page handles up to ${MAX_N}.` };
  const kt = kraw.trim();
  if (!/^-?\d+$/.test(kt)) return { ok: false, msg: `k must be a whole number between 1 and ${w.length}.` };
  const k = Number(kt);
  if (k < 1) return { ok: false, msg: `k = ${k} is too small. You need at least 1 group.` };
  if (k > w.length) return { ok: false, msg: `k = ${k} is more than the ${w.length} boxes. Each group needs at least one box, so k can be at most ${w.length}.` };
  return { ok: true, w, k };
}

function applyInput() {
  S = parseInput($("#weights").value, $("#kval").value);
  const m = $("#inputmsg");
  if (S.ok) {
    const total = S.w.reduce((a, b) => a + b, 0);
    m.className = "inputmsg ok";
    m.innerHTML = `${plural(S.w.length, "box", "boxes")} · answer between <b>${Math.max(...S.w)}</b> (biggest box) and <b>${total}</b> (total)`;
  } else { m.className = "inputmsg err"; m.innerHTML = "⚠ " + S.msg; }
  renderTry(); syncBruteFromInput(); renderSplits(); buildDP(); buildBS();
}
let tmr = null;
["weights", "kval"].forEach(id => $("#" + id).addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(applyInput, 250); }));
$("#inputbar").addEventListener("submit", e => { e.preventDefault(); clearTimeout(tmr); applyInput(); });
$("#reset").addEventListener("click", () => { $("#weights").value = DEFAULT_W; $("#kval").value = DEFAULT_K; applyInput(); });
const errorBox = () => `<div class="errorbox"><b>Check the input above.</b> ${S.msg}</div>`;

/* ============ TAB 1: Try it ============ */
function renderTry() {
  const el = $("#try-body");
  if (!S.ok) { el.innerHTML = errorBox(); return; }
  const { w, k } = S;
  const rows = [];
  const bf = w.length <= 20 ? bruteForce(w, k) : null;
  const dp = dpSolve(w, k), bs = binarySearch(w, k);
  const methods = [
    { name: "Brute force", tag: "BF", sub: "try every split", c: "--bf", r: bf },
    { name: "Dynamic programming", tag: "DP", sub: "fill a table", c: "--dp", r: dp },
    { name: "Binary search", tag: "BS", sub: "guess a limit", c: "--bs", r: bs },
  ];
  for (const m of methods) {
    if (!m.r) {
      rows.push(`<div class="res" style="--mc:var(${m.c})"><div class="mname"><span class="mtag">${m.tag}</span><span>${m.name}</span><small>${m.sub}</small></div>
        <div class="ans">—</div><div class="note">Too slow above 20 boxes (see the Brute force tab)</div><div class="chk">skipped</div></div>`);
      continue;
    }
    const ck = checkSplit(w, k, m.r.groups, m.r.answer);
    rows.push(`<div class="res" style="--mc:var(${m.c})"><div class="mname"><span class="mtag">${m.tag}</span><span>${m.name}</span><small>${m.sub}</small></div>
      <div class="ans">${m.r.answer}<small>heaviest</small></div>${groupsHTML(w, m.r.groups)}
      <div class="chk ${ck.ok ? "pass" : "fail"}">${ck.ok ? "✔ valid" : "✘ invalid"}<span class="why">${ck.why}</span></div></div>`);
  }
  const answers = methods.filter(m => m.r).map(m => m.r.answer);
  const agree = answers.every(a => a === answers[0]);
  const who = bf ? "All three methods agree" : "DP and binary search agree (brute force skipped)";
  const sameGroups = bf && [bf, dp, bs].every(r => JSON.stringify(r.groups) === JSON.stringify(dp.groups));
  el.innerHTML = `<div class="results">${rows.join("")}</div>
    <div class="agree${agree ? "" : " no"}">${agree ? `✔ ${who}: heaviest group = ${answers[0]}` : `✘ The methods disagree: ${answers.join(", ")}`}
    ${agree && bf && !sameGroups ? `<span class="hint"> · the groups differ, but every split is valid and equally good</span>` : ""}</div>`;
}

/* ============ TAB 2: Brute force ============ */
const US = 2e-6, LIMIT = 60;
function fmtTime(s) {
  if (s < 1e-3) return `${Math.round(s * 1e6)} µs`;
  if (s < 1) return `${(s * 1e3).toFixed(s < 0.01 ? 2 : 1)} ms`;
  if (s < 60) return `${s.toFixed(1)} seconds`;
  if (s < 3600) return `${(s / 60).toFixed(1)} minutes`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hours`;
  if (s < 3.156e7) return `${(s / 86400).toFixed(1)} days`;
  return `${(s / 3.156e7).toFixed(1)} years`;
}
function kFor(n) {
  if (!$("#kmanual").checked) return Math.max(1, Math.floor(n / 2));
  const v = parseInt($("#kbf").value, 10);
  return Number.isFinite(v) ? v : NaN;
}
function syncBruteFromInput() {
  if (S.ok) $("#nslider").value = Math.min(40, Math.max(4, S.w.length));
  renderBrute();
}
function renderBrute() {
  const n = +$("#nslider").value; $("#nlab").textContent = n;
  const manual = $("#kmanual").checked; $("#kbf").disabled = !manual;
  let k = kFor(n), note = "";
  if (!manual) { $("#kbf").value = k; note = "k follows n/2"; }
  if (manual && (!Number.isFinite(k) || k < 1 || k > n)) {
    $("#kbfnote").innerHTML = `<span style="color:var(--bad);font-weight:700">⚠ k must be a whole number from 1 to ${n}</span>`;
    $("#bfcount").textContent = "—"; $("#bftime").textContent = "—"; $("#bfbadge").innerHTML = ""; drawChart(n, null); return;
  }
  $("#kbfnote").textContent = note;
  const c = comb(n - 1, k - 1), secs = Number(c) * US;
  $("#bfcount").textContent = fmt(c);
  $("#bftime").textContent = fmtTime(secs);
  $("#bftimestat").classList.toggle("over", secs > LIMIT);
  $("#bfbadge").innerHTML = secs > LIMIT
    ? `<span class="badge over">✘ Over the 60 s limit: stopped</span>`
    : `<span class="badge ok">✔ Finishes within 60 s</span>`;
  drawChart(n, k);
}
function drawChart(cur, kcur) {
  const W = 760, H = 215, L = 70, R = 14, T = 12, B = 40;
  const lmin = -6, lmax = 6;  // 1 µs .. 1e6 s
  const y = s => T + (H - T - B) * (1 - (Math.log10(Math.max(s, 1e-6)) - lmin) / (lmax - lmin));
  const ns = []; for (let n = 4; n <= 40; n++) ns.push(n);
  const bw = (W - L - R) / ns.length;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated brute force time per n on a log scale"><defs>
    <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="7" height="7" fill="var(--bad)"></rect><line x1="0" y1="0" x2="0" y2="7" stroke="var(--surface)" stroke-width="2.5"></line></pattern></defs>`;
  const ticks = [[1e-6, "1 µs"], [1e-3, "1 ms"], [1, "1 s"], [3600, "1 hour"], [86400, "1 day"]];
  for (const [s, lab] of ticks) svg += `<line x1="${L}" x2="${W - R}" y1="${y(s)}" y2="${y(s)}" stroke="var(--soft)" stroke-width="1.5"></line>
    <text x="${L - 8}" y="${y(s) + 6}" text-anchor="end" font-size="17">${lab}</text>`;
  ns.forEach((n, i) => {
    const k = $("#kmanual").checked ? kcur : Math.max(1, Math.floor(n / 2));
    if (k == null || k > n) return;
    const s = Number(comb(n - 1, k - 1)) * US, over = s > LIMIT;
    const x = L + i * bw + 1.5, yy = y(s), h = (H - B) - yy;
    svg += `<rect x="${x}" y="${yy}" width="${bw - 3}" height="${Math.max(h, 1)}" fill="${over ? "url(#hatch)" : "var(--bf)"}"
      ${n === cur ? `stroke="var(--red)" stroke-width="4"` : ""}></rect>`;
    if (n % 4 === 0 || n === cur) svg += `<text x="${x + bw / 2 - 1.5}" y="${H - B + 22}" text-anchor="middle" font-size="17" ${n === cur ? `font-weight="800"` : ""}>${n}</text>`;
  });
  svg += `<line x1="${L}" x2="${W - R}" y1="${y(LIMIT)}" y2="${y(LIMIT)}" stroke="var(--bad)" stroke-width="3" stroke-dasharray="8 5"></line>
    <text x="${L + 8}" y="${y(LIMIT) - 7}" font-size="18" font-weight="800" fill="var(--bad)" style="fill:var(--bad)">60 s stopping limit</text>
    <line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="var(--ink)" stroke-width="2"></line>
    <text x="${W - R}" y="${H - 2}" text-anchor="end" font-size="17">number of boxes n → (log scale)</text></svg>`;
  $("#bfchart").innerHTML = svg + `<div class="legend"><span><b>Solid black</b> = under 60 s</span><span><b class="r">Red, striped</b> = over 60 s</span><span><b class="r">Red outline</b> = current n</span></div>`;
}
function renderSplits() {
  const el = $("#splitsbody");
  if (!S.ok) { $("#splitstitle").textContent = "Every split of your boxes"; el.innerHTML = errorBox(); return; }
  const { w, k } = S;
  $("#splitstitle").innerHTML = `Every split of your boxes [${w.join(", ")}], k = ${k}`;
  if (w.length > 8) { el.innerHTML = `<div class="note">The full list is shown for 8 boxes or fewer. Your input has ${w.length} boxes: brute force would check ${fmt(comb(w.length - 1, k - 1))} splits.</div>`; return; }
  const r = bruteForce(w, k, true);
  const rows = r.all.map((s, i) => {
    const gs = cutsToGroups(w.length, s.cuts), best = s.max === r.answer;
    return `<tr class="${best ? "best" : ""}"><td>${i + 1}</td><td class="mono">${gs.map(g => list(w, g)).join(" | ")}</td>
      <td>${s.max}${best ? ` <span class="bestlab">★ best</span>` : ""}</td></tr>`;
  }).join("");
  el.innerHTML = `<div class="splits"><table><thead><tr><th>#</th><th>Split</th><th>Heaviest</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="hint">${plural(r.count, "split", "splits")} checked = C(${w.length - 1}, ${k - 1}). Best heaviest group: <b>${r.answer}</b>.</div>`;
}
$("#nslider").addEventListener("input", renderBrute);
$("#kmanual").addEventListener("change", () => { if ($("#kmanual").checked && S.ok) $("#kbf").value = Math.min(S.k, +$("#nslider").value); renderBrute(); });
$("#kbf").addEventListener("input", renderBrute);

/* ============ step engine (DP and binary search tabs) ============ */
const SPEEDS = { slow: 1800, normal: 1000, fast: 450 };
let speed = "normal";
const steppers = {};
class Stepper {
  constructor(id, host, render) {
    this.id = id; this.render = render; this.steps = [{}]; this.i = 0; this.t = null;
    host.innerHTML = `<div class="controls">
      <button class="btn" data-a="back" type="button">◀ Back</button>
      <button class="btn primary" data-a="next" type="button">Next step ▶</button>
      <button class="btn" data-a="play" type="button">▶ Play</button>
      <button class="btn" data-a="restart" type="button">⟲ Restart</button>
      <span class="count num"></span><span class="spacer"></span>
      <label>Speed <select data-a="speed"><option value="slow">slow</option><option value="normal" selected>normal</option><option value="fast">fast</option></select></label>
      <span class="hint">← → keys step</span></div>`;
    this.c = host.querySelector(".controls");
    this.c.addEventListener("click", e => { const a = e.target.closest("button")?.dataset.a; if (a) this[a](); });
    this.c.querySelector("select").addEventListener("change", e => { speed = e.target.value; Object.values(steppers).forEach(s => s.syncSpeed()); });
    steppers[id] = this;
  }
  syncSpeed() { this.c.querySelector("select").value = speed; }
  setSteps(steps) { this.pause(); this.steps = steps; this.i = 0; this.draw(); }
  draw() {
    this.render(this.steps[this.i], this.i, this.steps.length);
    this.c.querySelector(".count").textContent = `Step ${this.i + 1} of ${this.steps.length}`;
    this.c.querySelector('[data-a="back"]').disabled = this.i === 0;
    this.c.querySelector('[data-a="next"]').disabled = this.i >= this.steps.length - 1;
    this.c.querySelector('[data-a="play"]').textContent = this.t ? "❚❚ Pause" : "▶ Play";
  }
  next() { if (this.i < this.steps.length - 1) { this.i++; this.draw(); } if (this.i >= this.steps.length - 1) this.pause(); }
  back() { this.pause(); if (this.i > 0) { this.i--; this.draw(); } }
  restart() { this.pause(); this.i = 0; this.draw(); }
  play() { if (this.t) { this.pause(); return; } if (this.i >= this.steps.length - 1) this.i = 0; this.tick(); }
  tick() { this.t = setTimeout(() => { this.t = null; this.next(); if (this.i < this.steps.length - 1) this.tick(); else this.draw(); }, SPEEDS[speed]); this.draw(); }
  pause() {
    if (this.t) clearTimeout(this.t);
    this.t = null;
    const b = this.c && this.c.querySelector('[data-a="play"]');
    if (b) b.textContent = "▶ Play";
  }
}

/* ============ TAB 3: DP table ============ */
$("#dp-body").innerHTML = `<div id="dp-ctl"></div>
  <label class="toggle" for="dpdetail"><input id="dpdetail" type="checkbox" checked> Show every candidate (untick for one cell per step)</label>
  <div id="dp-view"></div>`;
const dpStepper = new Stepper("dp", $("#dp-ctl"), renderDPStep);
$("#dpdetail").addEventListener("change", buildDP);
const G = (n) => n === 1 ? "group" : "groups", Bx = (n) => n === 1 ? "box" : "boxes";

function buildDP() {
  const ctl = $("#dp-ctl"), view = $("#dp-view");
  if (!S.ok) { ctl.hidden = true; view.innerHTML = errorBox(); return; }
  if (S.w.length > 10 || S.k > 5) { ctl.hidden = true; view.innerHTML = `<div class="note">For readability the table is shown for up to 10 boxes and k up to 5. Your input has ${S.w.length} boxes and k = ${S.k}. Try the example (Reset to example).</div>`; return; }
  ctl.hidden = false;
  const { w, k } = S, n = w.length, detail = $("#dpdetail").checked;
  const R = dpSolve(w, k), pre = R.pre;
  const vals = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(null));
  const steps = [];
  const snap = (o) => steps.push(Object.assign({ vals: vals.map(r => r.slice()), cur: null, cmp: [], win: null, lg: [], path: [], groups: null }, o));
  snap({ text: `The table is empty. Row 1 is easy: 1 group holds all the first boxes, so it equals the running total.`, sub: `Columns = how many boxes so far. Rows = how many groups. A dash means impossible: fewer boxes than groups.` });
  for (let i = 1; i <= n; i++) {
    vals[1][i] = pre[i];
    const lg = [...Array(i).keys()];
    snap({ cur: [1, i], lg, text: `1 group of the first ${plural(i, "box", "boxes")}: <code>${list(w, lg)}</code> weighs <b>${pre[i]}</b>, the running total.` });
  }
  for (let j = 2; j <= k; j++) {
    for (let i = j; i <= n; i++) {
      const cands = []; let best = Infinity, bp = -1;
      for (let p = j - 1; p <= i - 1; p++) {
        const lg = []; for (let q = p; q < i; q++) lg.push(q);
        const last = pre[i] - pre[p], prev = R.dp[j - 1][p], c = Math.max(prev, last);
        cands.push({ p, c });
        if (c < best) { best = c; bp = p; }
        if (detail) snap({ cur: [j, i], cmp: [[j - 1, p]], lg,
          text: `last group <code>${list(w, lg)}</code> weighs ${last}; best for the first ${plural(p, "box", "boxes")} in ${j - 1} ${G(j - 1)} is ${prev}; max(${prev}, ${last}) = <b>${c}</b>`,
          sub: `Filling: ${j} ${G(j)}, ${i} ${Bx(i)}. Candidates so far: ${cands.map(x => x.c).join(", ")} · smallest so far: ${best}` });
      }
      vals[j][i] = best;
      const lg = []; for (let q = bp; q < i; q++) lg.push(q);
      snap({ cur: [j, i], cmp: cands.map(x => [j - 1, x.p]), win: [j - 1, bp], lg,
        text: `Winner: last group <code>${list(w, lg)}</code>, max(${R.dp[j - 1][bp]}, ${pre[i] - pre[bp]}) = <b>${best}</b>. Write ${best} in the cell.`,
        sub: `${j} ${G(j)}, ${i} ${Bx(i)}: candidates ${cands.map(x => x.c).join(", ")}; we keep the smallest and remember where its last group starts.` });
    }
  }
  // backtracking
  const colored = new Array(n).fill(-1), path = [];
  let i = n;
  snap({ path: [[k, n]], text: `Table full. The answer is the bottom-right cell: <b>${R.dp[k][n]}</b>. Now walk back through the stored choices to find the groups.`, sub: `` });
  for (let j = k; j >= 1; j--) {
    const p = R.ch[j][i], g = []; for (let q = p; q < i; q++) { g.push(q); colored[q] = j - 1; }
    path.push([j, i]);
    snap({ path: path.slice(), lg: g, colored: colored.slice(),
      text: `Cell (${j} ${G(j)}, ${i} ${Bx(i)}) chose last group <code>${list(w, g)}</code> = ${pre[i] - pre[p]}. Colour it G${j}${p > 0 ? `, then jump to ${j - 1} ${G(j - 1)}, ${p} ${Bx(p)}.` : "."}`, sub: `` });
    i = p;
  }
  snap({ path: path.slice(), colored: colored.slice(), groups: R.groups, text: `Final split: <code>${R.groups.map(g => list(w, g)).join(" | ")}</code>, heaviest group <b>${R.answer}</b>.`, sub: `` });
  dpStepper.setSteps(steps);
}

function renderDPStep(st) {
  if (!S.ok || !st.vals) return;
  const { w, k } = S, n = w.length, pre = prefix(w);
  const has = (arr, j, i) => arr.some(c => c[0] === j && c[1] === i);
  let h = `<div class="dptable"><table>`;
  h += `<tr class="wrow"><th class="rowh">box weight</th>${w.map((v, i) => `<td class="${st.lg.includes(i) ? "lg" : ""}">${v}</td>`).join("")}</tr>`;
  h += `<tr class="prow"><th class="rowh">running total</th>${pre.slice(1).map(v => `<td>${v}</td>`).join("")}</tr>`;
  if (st.colored) h += `<tr class="grow"><th class="rowh">group</th>${st.colored.map(g => g < 0 ? `<td></td>` : `<td class="gcell" style="background:${gcol(g)}">G${g + 1}</td>`).join("")}</tr>`;
  h += `<tr class="sep"><th></th>${w.map(() => "<td></td>").join("")}</tr>`;
  h += `<tr><th class="rowh">groups ↓ · boxes →</th>${w.map((_, i) => `<th>${plural(i + 1, "box", "boxes")}</th>`).join("")}</tr>`;
  for (let j = 1; j <= k; j++) {
    h += `<tr><th class="rowh">${plural(j, "group", "groups")}</th>`;
    for (let i = 1; i <= n; i++) {
      if (i < j) { h += `<td class="imp">–</td>`; continue; }
      const isCur = st.cur && st.cur[0] === j && st.cur[1] === i;
      const isWin = st.win && st.win[0] === j && st.win[1] === i;
      const isCmp = has(st.cmp, j, i), isPath = has(st.path, j, i);
      const cls = isCur ? "cur" : isWin ? "win" : isCmp ? "cmp" : isPath ? "path" : "";
      const mk = isCur ? "●" : isWin ? "✓" : isCmp ? "○" : isPath ? "◆" : "";
      const v = st.vals[j][i];
      h += `<td class="${cls}">${v == null ? (isCur ? "?" : "") : v}${mk ? `<span class="mk">${mk}</span>` : ""}</td>`;
    }
    h += `</tr>`;
  }
  h += `</table></div>`;
  h += `<div class="legend"><span><b class="r">● red</b> = filling</span><span><b>○ dashed</b> = compared</span><span><b>✓ black</b> = winner</span><span><b>outlined boxes</b> = last group</span><span><b>◆</b> backtracking path</span></div>`;
  h += `<div class="calc">${st.text}${st.sub ? `<div class="sub">${st.sub}</div>` : ""}</div>`;
  $("#dp-view").innerHTML = h;
}

/* ============ TAB 4: Binary search ============ */
$("#bs-body").innerHTML = `<div id="bs-ctl"></div>
  <label class="toggle" for="bsdetail"><input id="bsdetail" type="checkbox" checked> Pack box by box (untick for one round per step)</label>
  <div id="bs-view"></div>`;
const bsStepper = new Stepper("bs", $("#bs-ctl"), renderBSStep);
$("#bsdetail").addEventListener("change", buildBS);

function buildBS() {
  const ctl = $("#bs-ctl"), view = $("#bs-view");
  if (!S.ok) { ctl.hidden = true; view.innerHTML = errorBox(); return; }
  if (S.w.length > 20) { ctl.hidden = true; view.innerHTML = `<div class="note">For readability the packing is animated for up to 20 boxes. Your input has ${S.w.length}. The Try it tab still shows the binary search answer.</div>`; return; }
  ctl.hidden = false;
  const { w, k } = S, n = w.length, detail = $("#bsdetail").checked;
  const R = binarySearch(w, k), lo0 = Math.max(...w), hi0 = w.reduce((a, b) => a + b, 0);
  const steps = [], history = [], tried = [];
  const snap = o => steps.push(Object.assign({ lo: lo0, hi: hi0, guess: null, bags: [], placed: 0, now: -1, limit: null, history: history.slice(), tried: tried.slice(), overFrom: Infinity, answer: null, splitHL: -1, groups: null, phase: "search" }, o));
  snap({ text: `The answer is at least the biggest box (<b>${lo0}</b>) and at most the total (<b>${hi0}</b>). Range: ${lo0}–${hi0}.` });
  R.rounds.forEach((r, ri) => {
    const base = { lo: r.lo, hi: r.hi, guess: r.guess, limit: r.guess };
    snap(Object.assign({}, base, { text: `Round ${ri + 1}: range ${r.lo}–${r.hi}. Guess the middle: ⌊(${r.lo} + ${r.hi}) / 2⌋ = <b>${r.guess}</b>. Can we pack into ${k} bags with limit ${r.guess}?` }));
    if (detail) {
      const bags = []; let cur = 0;
      for (let i = 0; i < n; i++) {
        let why;
        if (bags.length && cur + w[i] <= r.guess) { bags[bags.length - 1].push(i); why = `${cur} + ${w[i]} = ${cur + w[i]} ≤ ${r.guess}, so it joins bag ${bags.length}.`; cur += w[i]; }
        else if (!bags.length) { bags.push([i]); cur = w[i]; why = `it starts bag 1.`; }
        else { why = `${cur} + ${w[i]} = ${cur + w[i]} > ${r.guess}, so bag ${bags.length} is closed and bag ${bags.length + 1} opens.`; bags.push([i]); cur = w[i]; }
        snap(Object.assign({}, base, { bags: bags.map(b => b.slice()), placed: i + 1, now: i, overFrom: k, text: `Box ${w[i]}: ${why}` }));
      }
    }
    history.push(r); tried.push({ g: r.guess, pass: r.pass });
    snap(Object.assign({}, base, { lo: r.newLo, hi: r.newHi, prevLo: r.lo, prevHi: r.hi, bags: r.bags, placed: n, overFrom: k, history: history.slice(), tried: tried.slice(),
      text: r.pass
        ? `${plural(r.bags.length, "bag", "bags")} needed ≤ k = ${k}: <span class="res-pass">PASS</span>. Limit ${r.guess} works, so the answer is at most ${r.guess}. New range ${r.newLo}–${r.newHi}.`
        : `${r.bags.length} bags needed > k = ${k}: <span class="res-fail">FAIL</span>. Limit ${r.guess} is too small, so the answer is at least ${r.guess + 1}. New range ${r.newLo}–${r.newHi}.` }));
  });
  const A = R.answer;
  snap({ lo: A, hi: A, guess: A, answer: A, history: history.slice(), tried: tried.slice(), limit: A, bags: R.finalBags, placed: n, phase: "answer",
    text: `The range is the single number <b>${A}</b>. Answer: the heaviest group can be <b>${A}</b>. Packing at limit ${A} uses ${plural(R.finalBags.length, "bag", "bags")}.` });
  if (R.splits.length === 0) {
    snap({ lo: A, hi: A, guess: A, answer: A, history: history.slice(), tried: tried.slice(), limit: A, bags: R.groups, placed: n, groups: R.groups, phase: "exact",
      text: `Exactly k groups: packing at ${A} already gives exactly ${k} bags, so these are our ${k} groups. Heaviest = ${A}.` });
  } else {
    let before = R.finalBags;
    R.splits.forEach((s, si) => {
      snap({ lo: A, hi: A, guess: A, answer: A, history: history.slice(), tried: tried.slice(), limit: A, bags: before, placed: n, splitHL: s.from, phase: "exact",
        text: `Exactly k groups: we have ${before.length} bags but need ${k}. Split bag ${s.from + 1} <code>${list(w, before[s.from])}</code>: its last box moves into a new group.` });
      snap({ lo: A, hi: A, guess: A, answer: A, history: history.slice(), tried: tried.slice(), limit: A, bags: s.snapshot, placed: n, splitHL: s.from + 1, phase: "exact",
        text: `Now ${plural(s.snapshot.length, "group", "groups")}. Splitting only makes bags lighter, so the heaviest group stays <b>${heaviest(w, s.snapshot)}</b>.` });
      before = s.snapshot;
    });
    snap({ lo: A, hi: A, guess: A, answer: A, history: history.slice(), tried: tried.slice(), limit: A, bags: R.groups, placed: n, groups: R.groups, phase: "exact",
      text: `Exactly ${k} groups: <code>${R.groups.map(g => list(w, g)).join(" | ")}</code>, heaviest still <b>${A}</b>.` });
  }
  bsStepper.setSteps(steps);
}

function numberLine(st) {
  const { w } = S, mn = Math.max(...w), mx = w.reduce((a, b) => a + b, 0);
  const W = 1200, H = 136, L = 60, R = 60, Y = 58;
  const x = v => mx === mn ? (L + W - R) / 2 : L + (W - L - R) * (v - mn) / (mx - mn);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line of possible answers">`;
  s += `<line x1="${L}" x2="${W - R}" y1="${Y}" y2="${Y}" stroke="var(--ink)" stroke-width="3"></line>`;
  for (const v of [mn, mx]) s += `<line x1="${x(v)}" x2="${x(v)}" y1="${Y - 9}" y2="${Y + 9}" stroke="var(--ink)" stroke-width="3"></line>`;
  s += `<rect x="${x(st.lo) - 9}" y="${Y - 13}" width="${Math.max(18, x(st.hi) - x(st.lo) + 18)}" height="26" rx="6" fill="var(--bs-tint)" stroke="var(--bs)" stroke-width="3"></rect>`;
  if (x(st.hi) - x(st.lo) > 150) s += `<text x="${(x(st.lo) + x(st.hi)) / 2}" y="${Y + 6}" text-anchor="middle" font-size="17" font-weight="700">still possible</text>`;
  const labs = new Map([[mn, "var(--ink)"], [mx, "var(--ink)"]]);
  labs.set(st.lo, "var(--bs)"); labs.set(st.hi, "var(--bs)");
  let lastX = -1e9;
  for (const [v, c] of [...labs].sort((a, b) => a[0] - b[0])) {
    if (x(v) - lastX < 34 && v !== mx) continue;
    s += `<text x="${x(v)}" y="${Y + 34}" text-anchor="middle" font-size="19" font-weight="800" style="fill:${c}">${v}</text>`; lastX = x(v);
  }
  const rowEnd = [-1e9, -1e9];
  [...st.tried].sort((a, b) => a.g - b.g).forEach(t => {
    if (t.g === st.guess && st.answer == null) return;
    const gx = x(t.g), row = gx - rowEnd[0] >= 56 ? 0 : 1;
    rowEnd[row] = gx;
    s += `<text x="${gx}" y="${Y + (row ? 76 : 58) + 0}" text-anchor="middle" font-size="17" font-weight="800" style="fill:${t.pass ? "var(--good)" : "var(--bad)"}">${t.pass ? "✓" : "✗"}${t.g}</text>`;
  });
  if (st.guess != null) {
    const gx = x(st.guess);
    s += `<path d="M${gx - 10},${Y - 34} L${gx + 10},${Y - 34} L${gx},${Y - 16} Z" fill="var(--bs)"></path>`;
    const anchor = gx < 120 ? "start" : gx > W - 120 ? "end" : "middle";
    s += `<text x="${gx}" y="${Y - 42}" text-anchor="${anchor}" font-size="20" font-weight="800">${st.answer != null ? "answer" : "guess"} ${st.guess}</text>`;
  }
  return `<div class="numline">${s}</svg><div class="legend"><span>Line from the biggest box (<b>${mn}</b>) to the total (<b>${mx}</b>)</span><span><b>Shaded</b> = range still possible</span><span><b>✓</b> passed guess · <b>✗</b> failed guess</span></div></div>`;
}

function renderBSStep(st) {
  if (!S.ok || !st.tried) return;
  const { w, k } = S;
  let h = numberLine(st);
  h += `<div class="bstext">${st.text}</div>`;
  h += `<div class="bsrow"><div style="display:flex;flex-direction:column;gap:8px;min-width:0">`;
  if (st.answer != null) h += `<div class="answer">Answer: heaviest group = ${st.answer}</div>`;
  if (st.phase === "search") h += `<div class="queue"><span class="qlab">Boxes in order:</span>${w.map((v, i) => boxHTML(v, i < st.placed ? (i === st.now ? "now" : "done") : "")).join("")}${st.now >= 0 ? `<span class="hint">outlined = box being placed</span>` : ""}</div>`;
  if (st.groups) h += groupsHTML(w, st.groups);
  else {
    h += `<div class="bags">` + (st.bags.length ? st.bags.map((b, bi) => {
      const tot = groupSum(w, b), over = bi >= st.overFrom;
      return `<div class="bag${over ? " over" : ""}${bi === st.splitHL ? " split" : ""}"><div class="bh"><span>Bag ${bi + 1}</span>${over ? `<span>over k</span>` : ""}</div>
        <div class="bb">${b.map(i => boxHTML(w[i], i === st.now ? "new" : "")).join("")}</div>
        <div class="bt">${tot} / limit ${st.limit}</div></div>`;
    }).join("") : `<span class="hint">Bags appear here as the boxes are packed.</span>`) + `</div>`;
  }
  h += `</div><div class="hist"><table><thead><tr><th>Round</th><th>Range</th><th>Guess</th><th>Bags</th><th>Result</th><th>New range</th></tr></thead><tbody>`;
  h += st.history.length ? st.history.map((r, i) => `<tr><td>${i + 1}</td><td>${r.lo}–${r.hi}</td><td><b>${r.guess}</b></td><td>${r.bags.length}</td>
      <td class="${r.pass ? "p" : "f"}">${r.pass ? "PASS" : "FAIL"}</td><td>${r.newLo}–${r.newHi}</td></tr>`).join("")
    : `<tr><td colspan="6" class="hint">Rounds appear here.</td></tr>`;
  h += `</tbody></table></div></div>`;
  $("#bs-view").innerHTML = h;
}

/* ============ tabs + keys ============ */
const TABS = ["try", "brute", "dp", "binary"];
let active = "try";
function showTab(t) {
  if (!TABS.includes(t)) t = "try";
  active = t;
  for (const id of TABS) {
    $("#p-" + id).hidden = id !== t;
    $("#tab-" + id).setAttribute("aria-selected", String(id === t));
  }
  Object.values(steppers).forEach(s => s.pause());
  try { history.replaceState(null, "", "#" + t); } catch (e) { /* file:// or sandbox */ }
}
document.querySelectorAll("nav.tabs button").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
document.addEventListener("keydown", e => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" && e.target.type !== "checkbox" || tag === "select" || tag === "textarea" || e.altKey || e.ctrlKey || e.metaKey) return;
  const st = active === "dp" ? dpStepper : active === "binary" ? bsStepper : null;
  if (st && (e.key === "ArrowRight" || e.key === "PageDown")) { e.preventDefault(); st.next(); }
  else if (st && (e.key === "ArrowLeft" || e.key === "PageUp")) { e.preventDefault(); st.back(); }
  else if (["1", "2", "3", "4"].includes(e.key)) showTab(TABS[+e.key - 1]);
});
window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

window.A11 = { bruteForce, dpSolve, binarySearch, pack, comb, checkSplit, parseInput };
applyInput();
showTab(location.hash.slice(1) || "try");
