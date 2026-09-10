/* ============================================================
   Momentum · store.js — schema v5, migration, persistence,
   derived queries for habits + gym
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, KEY = "momentum_v5";
  var LEGACY = ["momentum_v4", "glassTracker_v3", "glassTracker_v2", "glassTracker_v1"];
  var SCHEMA = 5;

  var COLORS = ["#64748b", "#0d9488", "#5b5f8f", "#c2410c", "#b45309", "#15803d", "#7c3f6b", "#0369a1", "#4d7c0f", "#9f1239"];
  M.COLORS = COLORS;

  var DEFAULT_HABITS = [
    { id: "workout", e: "🏋️", n: "Workout", t: "build", c: "#15803d", g: 4 },
    { id: "study", e: "📚", n: "Study / Learn", t: "build", c: "#5b5f8f", g: 6 },
    { id: "reading", e: "📖", n: "Reading", t: "build", c: "#0d9488", g: 5 },
    { id: "meditate", e: "🧘", n: "Meditation", t: "build", c: "#b45309", g: 0 },
    { id: "water", e: "💧", n: "Water (3 L)", t: "build", c: "#0369a1", g: 0 },
    { id: "sleep", e: "😴", n: "Sleep on time", t: "build", c: "#7c3f6b", g: 0 },
    { id: "wake", e: "🌅", n: "Wake early", t: "build", c: "#c2410c", g: 0 },
    { id: "walk", e: "🚶", n: "Walk / Steps", t: "build", c: "#64748b", g: 0 },
    { id: "journal", e: "📓", n: "Journal", t: "build", c: "#4d7c0f", g: 0 },
    { id: "junk", e: "🍔", n: "Junk Food", t: "quit", c: "#9f1239", g: 0 },
    { id: "screen", e: "📱", n: "Excess Screen Time", t: "quit", c: "#7c3f6b", g: 0 },
    { id: "procrast", e: "⏳", n: "Procrastination", t: "quit", c: "#b45309", g: 0 },
    { id: "coffee", e: "☕", n: "Coffee (cups)", t: "count", c: "#78350f", g: 0 }
  ];
  M.DEFAULT_HABITS = DEFAULT_HABITS;

  M.QUOTES = [
    ["Discipline is choosing between what you want now and what you want most.", "Abraham Lincoln"],
    ["We are what we repeatedly do. Excellence, then, is not an act but a habit.", "Aristotle"],
    ["Small daily improvements are the key to staggering long-term results.", "Robin Sharma"],
    ["Motivation gets you going, discipline keeps you growing.", "John C. Maxwell"],
    ["You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"],
    ["The body achieves what the mind believes.", "Napoleon Hill"]
  ];

  /* ---------------- shape ---------------- */
  function freshGym() {
    return {
      profile: { name: "", trainer: "", phone: "", city: "", currency: "₹", capacity: 0 },
      members: [], attendance: {}, metrics: {}, sessions: [], payments: [], rcptSeq: 1
    };
  }
  function fresh() {
    return {
      schema: SCHEMA,
      settings: {
      name: "You", theme: "dark", pin: null, unit: "kg", currency: "₹",
      route: "#/today", modules: { gym: true }, lastBackup: null, onboarded: false
    },
      habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
      logs: {}, mind: {}, gym: freshGym()
    };
  }
  M.fresh = fresh;

  function migrate(d) {
    if (!d || typeof d !== "object") return fresh();
    var s = (d.settings = d.settings || {});
    if (!s.name) s.name = "You";
    if (s.theme !== "light" && s.theme !== "dark") s.theme = "dark";
    if (s.pin === undefined) s.pin = null;
    if (!s.unit) s.unit = "kg";
    if (!s.route) s.route = "#/today";
    if (!s.modules) s.modules = { gym: true };
    if (s.modules.gym === undefined) s.modules.gym = true;
    if (!s.currency) s.currency = "₹";
    if (s.lastBackup === undefined) s.lastBackup = null;
    if (s.onboarded === undefined) s.onboarded = false;
    delete s.view; delete s.pinAsked; delete s._mirror;

    d.habits = (Array.isArray(d.habits) && d.habits.length ? d.habits : JSON.parse(JSON.stringify(DEFAULT_HABITS))).map(function (h) {
      return {
        id: h.id || M.uid("h"),
        e: h.e || "✨", n: h.n || "Habit",
        t: h.t === "good" ? "build" : h.t === "bad" ? "quit" : (h.t || "build"),
        c: h.c || "#64748b", g: h.g || 0, arch: !!h.arch
      };
    });
    d.logs = d.logs && typeof d.logs === "object" ? d.logs : {};
    d.mind = d.mind && typeof d.mind === "object" ? d.mind : {};

    var g = (d.gym = d.gym && typeof d.gym === "object" ? d.gym : freshGym());
    g.profile = Object.assign({ name: "", trainer: "", phone: "", city: "", currency: "₹", capacity: 0 }, g.profile || {});
    g.members = Array.isArray(g.members) ? g.members.map(normMember) : [];
    g.attendance = g.attendance && typeof g.attendance === "object" ? g.attendance : {};
    g.metrics = g.metrics && typeof g.metrics === "object" ? g.metrics : {};
    g.sessions = Array.isArray(g.sessions) ? g.sessions : [];
    g.payments = Array.isArray(g.payments) ? g.payments : [];
    if (!g.rcptSeq) g.rcptSeq = g.payments.length + 1;
    d.schema = SCHEMA;
    return d;
  }
  M.migrate = migrate;

  function normMember(m) {
    return Object.assign({
      id: M.uid("m"), name: "Member", phone: "", email: "", sex: "m", dob: "",
      joined: M.today(), level: "beg", goal: "fitness", height: 170, startWeight: 70, targetWeight: 0,
      activity: "light", diet: "veg", allergies: [], meals: 4, daysPerWeek: 4,
      plan: "monthly", fee: 1200, notes: "", notesLog: [], medical: "", trainer: "", status: "active",
      batch: "flex",
      program: null, dietPlan: null, archived: false
    }, m || {});
  }
  M.normMember = normMember;

  /* ---------------- persistence ---------------- */
  function load() {
    var i, r;
    try { r = localStorage.getItem(KEY); if (r) return migrate(JSON.parse(r)); } catch (e) { }
    for (i = 0; i < LEGACY.length; i++) {
      try { r = localStorage.getItem(LEGACY[i]); if (r) return migrate(JSON.parse(r)); } catch (e) { }
    }
    return fresh();
  }
  M.store = load();
  var timer = null;
  M.save = function () { clearTimeout(timer); timer = setTimeout(M.saveNow, 140); };
  M.saveNow = function () {
    try { localStorage.setItem(KEY, JSON.stringify(M.store)); }
    catch (e) { if (M.toast) M.toast("Save failed — storage full?", "no"); }
  };
  M.replaceStore = function (obj) { M.store = migrate(obj); M.saveNow(); };
  /* merge a backup into the current data instead of replacing it */
  M.mergeStore = function (obj) {
    var inc = migrate(JSON.parse(JSON.stringify(obj)));
    var cur = M.store, added = { habits: 0, days: 0, members: 0, sessions: 0, payments: 0, metrics: 0 };
    var hIds = {};
    cur.habits.forEach(function (h) { hIds[h.id] = 1; });
    inc.habits.forEach(function (h) { if (!hIds[h.id]) { cur.habits.push(h); added.habits++; } });
    Object.keys(inc.logs).forEach(function (dk) {
      if (!cur.logs[dk]) { cur.logs[dk] = inc.logs[dk]; added.days++; return; }
      Object.keys(inc.logs[dk]).forEach(function (hid) {
        if (cur.logs[dk][hid] == null) cur.logs[dk][hid] = inc.logs[dk][hid];
      });
    });
    Object.keys(inc.mind).forEach(function (dk) {
      if (!cur.mind[dk]) { cur.mind[dk] = inc.mind[dk]; return; }
      M.MIND_KEYS.forEach(function (k) {
        if (cur.mind[dk][k] == null && inc.mind[dk][k] != null) cur.mind[dk][k] = inc.mind[dk][k];
      });
    });
    if (!cur.gym.profile.name && inc.gym.profile.name) cur.gym.profile = inc.gym.profile;
    var mIds = {};
    cur.gym.members.forEach(function (m) { mIds[m.id] = 1; });
    inc.gym.members.forEach(function (m) { if (!mIds[m.id]) { cur.gym.members.push(m); added.members++; } });
    Object.keys(inc.gym.attendance).forEach(function (mid) {
      var r = cur.gym.attendance[mid] || (cur.gym.attendance[mid] = {});
      Object.keys(inc.gym.attendance[mid]).forEach(function (dk) { r[dk] = 1; });
    });
    Object.keys(inc.gym.metrics).forEach(function (mid) {
      var arr = cur.gym.metrics[mid] || (cur.gym.metrics[mid] = []);
      var have = {};
      arr.forEach(function (r) { have[r.d] = 1; });
      inc.gym.metrics[mid].forEach(function (r) { if (!have[r.d]) { arr.push(r); added.metrics++; } });
    });
    var sIds = {};
    cur.gym.sessions.forEach(function (x) { sIds[x.id] = 1; });
    inc.gym.sessions.forEach(function (x) { if (!sIds[x.id]) { cur.gym.sessions.push(x); added.sessions++; } });
    var pIds = {};
    cur.gym.payments.forEach(function (x) { pIds[x.id] = 1; });
    inc.gym.payments.forEach(function (x) { if (!pIds[x.id]) { cur.gym.payments.push(x); added.payments++; } });
    cur.gym.rcptSeq = Math.max(cur.gym.rcptSeq || 1, inc.gym.rcptSeq || 1);
    M.saveNow();
    return added;
  };
  M.KEY = KEY;

  /* ============================================================
     HABIT QUERIES
     ============================================================ */
  var H = (M.H = {});
  H.active = function () { return M.store.habits.filter(function (h) { return !h.arch; }); };
  H.byId = function (id) { return M.store.habits.filter(function (h) { return h.id === id; })[0]; };
  H.isSuccess = function (h, v) { return v == null ? false : h.t === "count" ? v === 0 : v === 1; };
  H.isMarked = function (h, v) { return v != null; };
  H.val = function (dk, id) { return (M.store.logs[dk] || {})[id]; };
  H.dayPct = function (dk) {
    var A = H.active(); if (!A.length) return 0;
    var log = M.store.logs[dk] || {}, s = 0;
    A.forEach(function (h) { if (H.isSuccess(h, log[h.id])) s++; });
    return Math.round((s / A.length) * 100);
  };
  H.dayDone = function (dk) {
    var A = H.active(), log = M.store.logs[dk] || {}, s = 0;
    A.forEach(function (h) { if (H.isSuccess(h, log[h.id])) s++; });
    return s;
  };
  H.hasData = function (dk) {
    var log = M.store.logs[dk];
    return log ? H.active().some(function (h) { return H.isMarked(h, log[h.id]); }) : false;
  };
  H.streak = function (h) {
    var d = new Date(), n = 0, first = true;
    while (n < 3000) {
      var v = H.val(M.keyOf(d), h.id);
      if (first && !H.isMarked(h, v)) { d = M.addDays(d, -1); first = false; continue; }
      first = false;
      if (H.isSuccess(h, v)) { n++; d = M.addDays(d, -1); } else break;
    }
    return n;
  };
  H.best = function (h) {
    var days = Object.keys(M.store.logs).sort(), best = 0, cur = 0, prev = null;
    days.forEach(function (dk) {
      var v = M.store.logs[dk][h.id];
      if (H.isSuccess(h, v)) {
        if (prev && M.dayDiff(prev, dk) === 1) cur++; else cur = 1;
        if (cur > best) best = cur;
        prev = dk;
      }
    });
    return best;
  };
  H.overall = function () {
    var d = new Date(), n = 0, first = true;
    while (n < 3000) {
      var dk = M.keyOf(d);
      if (first && !H.hasData(dk)) { d = M.addDays(d, -1); first = false; continue; }
      first = false;
      if (H.dayPct(dk) >= 100) { n++; d = M.addDays(d, -1); } else break;
    }
    return n;
  };
  H.weekProgress = function (h) {
    var ws = M.weekStart(new Date()), c = 0, i;
    for (i = 0; i < 7; i++) if (H.isSuccess(h, H.val(M.keyOf(M.addDays(ws, i)), h.id))) c++;
    return c;
  };
  H.monthPct = function (h) {
    var now = new Date(), dim = now.getDate(), mark = 0, ok = 0, i;
    for (i = 0; i < dim; i++) {
      var v = H.val(M.keyOf(M.addDays(now, -i)), h.id);
      if (H.isMarked(h, v)) { mark++; if (H.isSuccess(h, v)) ok++; }
    }
    return mark ? Math.round((ok / mark) * 100) : 0;
  };
  H.apply = function (id, dk, mode) {
    var h = H.byId(id); if (!h) return null;
    var log = M.store.logs[dk] || (M.store.logs[dk] = {});
    var prev = log[id];
    if (mode === "clear") delete log[id];
    else if (h.t === "count") log[id] = prev == null ? 0 : prev + 1;
    else log[id] = prev == null ? 1 : prev === 1 ? 0 : 1;
    if (!Object.keys(log).length) delete M.store.logs[dk];
    M.save();
    return { dk: dk, id: id, prev: prev };
  };
  H.undo = function (a) {
    if (!a) return;
    var log = M.store.logs[a.dk] || (M.store.logs[a.dk] = {});
    if (a.prev == null) delete log[a.id]; else log[a.id] = a.prev;
    if (!Object.keys(log).length) delete M.store.logs[a.dk];
    M.save();
  };

  /* ---------------- mental state ---------------- */
  M.MIND_ROWS = [["mood", "Mood", "😊"], ["mot", "Motivation", "🔥"], ["score", "Day score", "⭐"]];
  M.MIND_KEYS = ["mood", "mot", "score"];
  M.WEEKTINTS = ["#64748b", "#0d9488", "#0f766e", "#a16207", "#475569", "#334155"];
  M.MOOD_COLOR = "#64748b"; M.MOT_COLOR = "#0d9488";
  H.mindPct = function (dk) {
    var m = M.store.mind[dk]; if (!m) return null;
    var v = M.MIND_KEYS.map(function (k) { return m[k]; }).filter(function (x) { return x != null; });
    return v.length ? Math.round((M.sum(v) / v.length / 10) * 100) : null;
  };
  H.mindMonthAvg = function () {
    var now = new Date(), dim = now.getDate(), s = 0, c = 0, i;
    for (i = 0; i < dim; i++) { var p = H.mindPct(M.keyOf(M.addDays(now, -i))); if (p != null) { s += p; c++; } }
    return c ? Math.round(s / c) : 0;
  };
  H.weekMindAvg = function (y, m, wi, metric) {
    var sum = 0, c = 0, dim = M.daysIn(y, m), d;
    for (d = wi * 7 + 1; d <= Math.min((wi + 1) * 7, dim); d++) {
      var mm = M.store.mind[M.keyOf(new Date(y, m, d))]; if (!mm) continue;
      if (metric) { if (mm[metric] != null) { sum += mm[metric]; c++; } }
      else M.MIND_KEYS.forEach(function (k) { if (mm[k] != null) { sum += mm[k]; c++; } });
    }
    return c ? Math.round((sum / c / 10) * 100) : 0;
  };
  H.applyMind = function (metric, dk, mode, direct) {
    var m = M.store.mind[dk] || (M.store.mind[dk] = {});
    var prev = m[metric];
    if (mode === "clear") delete m[metric];
    else if (direct != null) { if (prev === direct) delete m[metric]; else m[metric] = direct; }
    else if (prev == null) m[metric] = 1;
    else if (prev >= 10) delete m[metric];
    else m[metric] = prev + 1;
    if (!Object.keys(m).length) delete M.store.mind[dk];
    M.save();
  };

  /* ============================================================
     GYM QUERIES
     ============================================================ */
  var G = (M.G = {});
  G.all = function () { return M.store.gym.members.filter(function (m) { return !m.archived; }); };
  G.active = function () { return G.all().filter(function (m) { return m.status === "active"; }); };
  G.byId = function (id) { return M.store.gym.members.filter(function (m) { return m.id === id; })[0]; };
  G.add = function (m) { var x = normMember(m); M.store.gym.members.push(x); M.save(); return x; };
  G.update = function (id, patch) { var m = G.byId(id); if (m) { Object.assign(m, patch); M.save(); } return m; };
  G.remove = function (id) {
    var g = M.store.gym;
    g.members = g.members.filter(function (m) { return m.id !== id; });
    delete g.attendance[id]; delete g.metrics[id];
    g.sessions = g.sessions.filter(function (s) { return s.mid !== id; });
    g.payments = g.payments.filter(function (p) { return p.mid !== id; });
    M.save();
  };

  G.archive = function (id) { var m = G.byId(id); if (m) { m.archived = true; M.save(); } };
  G.restore = function (id) {
    var m = M.store.gym.members.filter(function (x) { return x.id === id; })[0];
    if (m) { m.archived = false; M.save(); }
  };
  G.trash = function () { return M.store.gym.members.filter(function (m) { return m.archived; }); };

  /* ---- dated trainer notes ---- */
  G.notes = function (mid) {
    var m = G.byId(mid);
    return m && Array.isArray(m.notesLog) ? m.notesLog.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; }) : [];
  };
  G.addNote = function (mid, text) {
    var m = G.byId(mid); if (!m || !text) return null;
    if (!Array.isArray(m.notesLog)) m.notesLog = [];
    var n = { id: M.uid("n"), d: M.today(), t: text };
    m.notesLog.push(n); M.save();
    return n;
  };
  G.delNote = function (mid, nid) {
    var m = G.byId(mid); if (!m || !Array.isArray(m.notesLog)) return;
    m.notesLog = m.notesLog.filter(function (n) { return n.id !== nid; });
    M.save();
  };

  /* ---- attendance ---- */
  G.isIn = function (mid, dk) { return !!(M.store.gym.attendance[mid] || {})[dk]; };
  G.toggleIn = function (mid, dk) {
    var a = M.store.gym.attendance, r = a[mid] || (a[mid] = {});
    if (r[dk]) delete r[dk]; else r[dk] = 1;
    if (!Object.keys(r).length) delete a[mid];
    M.save();
    return !!r[dk];
  };
  G.visits = function (mid) { return Object.keys(M.store.gym.attendance[mid] || {}).sort(); };
  G.visitsIn = function (mid, fromDk, toDk) {
    return G.visits(mid).filter(function (k) { return k >= fromDk && k <= toDk; });
  };
  G.lastVisit = function (mid) { var v = G.visits(mid); return v.length ? v[v.length - 1] : null; };
  G.attPct = function (mid, days) {
    var m = G.byId(mid); if (!m) return 0;
    days = days || 28;
    var to = M.today(), from = M.keyOf(M.addDays(new Date(), -(days - 1)));
    if (m.joined > from) from = m.joined;
    var span = Math.max(1, M.dayDiff(from, to) + 1);
    var expect = Math.max(1, Math.round((span / 7) * (m.daysPerWeek || 4)));
    return Math.min(100, Math.round((G.visitsIn(mid, from, to).length / expect) * 100));
  };
  G.visitStreak = function (mid) {
    var v = G.visits(mid); if (!v.length) return 0;
    var i = v.length - 1, n = 1;
    while (i > 0) {
      if (M.dayDiff(v[i - 1], v[i]) <= 2) { n++; i--; } else break;
    }
    return n;
  };
  G.checkinsOn = function (dk) {
    var a = M.store.gym.attendance, n = 0;
    G.all().forEach(function (m) { if ((a[m.id] || {})[dk]) n++; });
    return n;
  };
  G.atRisk = function (days) {
    days = days || 7;
    return G.active().filter(function (m) {
      var lv = G.lastVisit(m.id);
      if (!lv) return M.dayDiff(m.joined, new Date()) >= days;
      return M.dayDiff(lv, new Date()) >= days;
    }).sort(function (a, b) {
      var la = G.lastVisit(a.id) || a.joined, lb = G.lastVisit(b.id) || b.joined;
      return la < lb ? -1 : 1;
    });
  };

  /* ---- body metrics ---- */
  G.metrics = function (mid) {
    return (M.store.gym.metrics[mid] || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  };
  G.addMetric = function (mid, rec) {
    var arr = M.store.gym.metrics[mid] || (M.store.gym.metrics[mid] = []);
    var ex = arr.filter(function (r) { return r.d === rec.d; })[0];
    if (ex) Object.assign(ex, rec); else arr.push(rec);
    M.save();
  };
  G.delMetric = function (mid, dk) {
    var arr = M.store.gym.metrics[mid] || [];
    M.store.gym.metrics[mid] = arr.filter(function (r) { return r.d !== dk; });
    M.save();
  };
  G.latest = function (mid) { var a = G.metrics(mid); return a.length ? a[a.length - 1] : null; };
  G.weight = function (m) {
    var l = G.latest(m.id);
    return l && l.w ? l.w : m.startWeight;
  };
  G.weightDelta = function (m) { return G.weight(m) - (m.startWeight || G.weight(m)); };
  G.bmi = function (m) {
    var h = (m.height || 170) / 100;
    return G.weight(m) / (h * h);
  };
  G.bmiLabel = function (b) {
    return b < 18.5 ? "Underweight" : b < 23 ? "Normal" : b < 25 ? "Overweight (Asian)" : b < 30 ? "Overweight" : "Obese";
  };
  /* US Navy body-fat estimate */
  G.bodyFat = function (m) {
    var l = G.latest(m.id); if (!l || !l.waist || !l.neck) return null;
    var h = m.height || 170, bf;
    if (m.sex === "f") {
      if (!l.hip) return null;
      bf = 163.205 * Math.log10(l.waist + l.hip - l.neck) - 97.684 * Math.log10(h) - 78.387;
    } else {
      bf = 86.010 * Math.log10(l.waist - l.neck) - 70.041 * Math.log10(h) + 36.76;
    }
    return bf > 2 && bf < 65 ? Math.round(bf * 10) / 10 : null;
  };
  G.lean = function (m) {
    var bf = G.bodyFat(m); if (bf == null) return null;
    return Math.round(G.weight(m) * (1 - bf / 100) * 10) / 10;
  };
  /* weekly rate of weight change over last n weeks */
  G.weeklyRate = function (mid, weeks) {
    var a = G.metrics(mid).filter(function (r) { return r.w; });
    if (a.length < 2) return null;
    weeks = weeks || 4;
    var from = M.keyOf(M.addDays(new Date(), -weeks * 7));
    var win = a.filter(function (r) { return r.d >= from; });
    if (win.length < 2) win = a.slice(-2);
    var f = win[0], l = win[win.length - 1], d = M.dayDiff(f.d, l.d);
    if (d <= 0) return null;
    return Math.round(((l.w - f.w) / d) * 7 * 100) / 100;
  };

  /* ---- sessions ---- */
  G.sessions = function (mid) {
    return M.store.gym.sessions.filter(function (s) { return s.mid === mid; })
      .sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
  };
  G.sessionsIn = function (mid, fromDk, toDk) {
    return M.store.gym.sessions.filter(function (s) {
      return (!mid || s.mid === mid) && s.d >= fromDk && s.d <= toDk;
    });
  };
  G.saveSession = function (s) {
    var g = M.store.gym;
    if (s.id) {
      var i = g.sessions.map(function (x) { return x.id; }).indexOf(s.id);
      if (i >= 0) { g.sessions[i] = s; M.save(); return s; }
    }
    s.id = s.id || M.uid("s");
    g.sessions.push(s);
    if (s.mid && s.d) { var a = g.attendance[s.mid] || (g.attendance[s.mid] = {}); a[s.d] = 1; }
    M.save();
    return s;
  };
  G.delSession = function (id) {
    M.store.gym.sessions = M.store.gym.sessions.filter(function (s) { return s.id !== id; });
    M.save();
  };
  G.sessionVolume = function (s) {
    var v = 0;
    (s.ex || []).forEach(function (e) {
      (e.sets || []).forEach(function (st) { v += (+st.w || 0) * (+st.r || 0); });
    });
    return Math.round(v);
  };
  G.sessionSets = function (s) {
    var n = 0;
    (s.ex || []).forEach(function (e) { n += (e.sets || []).length; });
    return n;
  };
  G.e1rm = function (wt, reps) {
    if (!wt || !reps) return 0;
    return Math.round(wt * (1 + reps / 30) * 10) / 10;
  };
  /* volume + sets per muscle group in a date window */
  G.muscleLoad = function (mid, fromDk, toDk) {
    var out = {};
    G.sessionsIn(mid, fromDk, toDk).forEach(function (s) {
      (s.ex || []).forEach(function (e) {
        var meta = M.EXDB.find(e.name) || { m: e.muscle || "other", s: [] };
        var sets = (e.sets || []).length;
        var vol = M.sum(e.sets || [], function (st) { return (+st.w || 0) * (+st.r || 0); });
        var primary = meta.m;
        out[primary] = out[primary] || { sets: 0, vol: 0 };
        out[primary].sets += sets; out[primary].vol += vol;
        (meta.s || []).forEach(function (sec) {
          out[sec] = out[sec] || { sets: 0, vol: 0 };
          out[sec].sets += sets * 0.5; out[sec].vol += vol * 0.3;
        });
      });
    });
    Object.keys(out).forEach(function (k) {
      out[k].sets = Math.round(out[k].sets * 10) / 10;
      out[k].vol = Math.round(out[k].vol);
    });
    return out;
  };
  /* personal records per exercise */
  G.prs = function (mid) {
    var map = {};
    G.sessions(mid).slice().reverse().forEach(function (s) {
      (s.ex || []).forEach(function (e) {
        (e.sets || []).forEach(function (st) {
          var wt = +st.w || 0, r = +st.r || 0;
          if (!wt && !r) return;
          var rec = map[e.name] || (map[e.name] = { name: e.name, wt: 0, reps: 0, e1: 0, d: s.d });
          var e1 = G.e1rm(wt, r);
          if (e1 > rec.e1) { rec.e1 = e1; rec.wt = wt; rec.reps = r; rec.d = s.d; }
        });
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.e1 - a.e1; });
  };
  G.prsSince = function (dk) {
    var out = [];
    G.all().forEach(function (m) {
      G.prs(m.id).forEach(function (p) { if (p.d >= dk) out.push({ member: m, pr: p }); });
    });
    return out.sort(function (a, b) { return a.pr.d < b.pr.d ? 1 : -1; });
  };
  /* last performance of an exercise (for overload suggestion) */
  G.lastEx = function (mid, name) {
    var ss = G.sessions(mid), i, j;
    for (i = 0; i < ss.length; i++) {
      var ex = (ss[i].ex || []);
      for (j = 0; j < ex.length; j++) if (ex[j].name === name) return { d: ss[i].d, ex: ex[j] };
    }
    return null;
  };
  G.suggest = function (mid, name, goal) {
    var last = G.lastEx(mid, name);
    if (!last) return null;
    var sets = (last.ex.sets || []).filter(function (s) { return +s.w || +s.r; });
    if (!sets.length) return null;
    var top = sets.slice().sort(function (a, b) { return G.e1rm(b.w, b.r) - G.e1rm(a.w, a.r); })[0];
    var repCap = goal === "strength" ? 6 : goal === "fatloss" || goal === "endurance" ? 15 : 12;
    if (+top.r >= repCap) return { w: Math.round((+top.w + (+top.w > 40 ? 2.5 : 1.25)) * 4) / 4, r: goal === "strength" ? 4 : 8, why: "add load" };
    return { w: +top.w, r: (+top.r || 8) + 1, why: "add a rep" };
  };

  /* per-exercise history: top set, best e1RM and volume per session */
  G.exHistory = function (mid, name) {
    var out = [];
    G.sessions(mid).slice().reverse().forEach(function (s) {
      (s.ex || []).forEach(function (e) {
        if (e.name !== name) return;
        var sets = (e.sets || []).filter(function (x) { return +x.w || +x.r; });
        if (!sets.length) return;
        var best = sets.slice().sort(function (a, b) { return G.e1rm(b.w, b.r) - G.e1rm(a.w, a.r); })[0];
        out.push({
          d: s.d, w: +best.w || 0, r: +best.r || 0, e1: G.e1rm(best.w, best.r),
          vol: Math.round(M.sum(sets, function (x) { return (+x.w || 0) * (+x.r || 0); })),
          sets: sets.length
        });
      });
    });
    return out;
  };
  G.exercisesUsed = function (mid) {
    var seen = {}, out = [];
    G.sessions(mid).forEach(function (s) {
      (s.ex || []).forEach(function (e) { if (!seen[e.name]) { seen[e.name] = 1; out.push(e.name); } });
    });
    return out.sort();
  };

  /* goal projection from the recent rate of change */
  G.projection = function (m) {
    var target = +m.targetWeight || 0;
    if (!target) return null;
    var cur = G.weight(m), rate = G.weeklyRate(m.id, 6);
    var need = target - cur;
    if (Math.abs(need) < .3) return { done: true, cur: cur, target: target, rate: rate };
    if (rate == null || Math.abs(rate) < .05) return { stalled: true, cur: cur, target: target, need: need, rate: rate };
    if ((need < 0 && rate > 0) || (need > 0 && rate < 0)) return { wrongWay: true, cur: cur, target: target, need: need, rate: rate };
    var weeks = Math.abs(need / rate);
    if (weeks > 130) return { slow: true, cur: cur, target: target, need: need, rate: rate };
    return {
      cur: cur, target: target, need: need, rate: rate,
      weeks: Math.round(weeks * 10) / 10,
      eta: M.keyOf(M.addDays(new Date(), Math.round(weeks * 7)))
    };
  };

  /* memberships expiring inside n days (renewal pipeline) */
  G.expiring = function (days) {
    return G.active().map(function (m) { return { m: m, days: G.dueDays(m) }; })
      .filter(function (x) { return x.days >= 0 && x.days <= days; })
      .sort(function (a, b) { return a.days - b.days; });
  };

  /* month-on-month business numbers: ym = "YYYY-MM" */
  G.monthStats = function (ym) {
    var all = M.store.gym.members.filter(function (m) { return !m.archived; });
    var joined = all.filter(function (m) { return String(m.joined).slice(0, 7) === ym; });
    var start = ym + "-01";
    var end = M.keyOf(new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0));
    var upto = end > M.today() ? M.today() : end;
    var roster = all.filter(function (m) { return m.joined <= end; });
    var visits = 0, expect = 0;
    roster.forEach(function (m) {
      visits += G.visitsIn(m.id, start, end).length;
      var from = m.joined > start ? m.joined : start;
      var span = Math.max(1, M.dayDiff(from, upto) + 1);
      expect += Math.max(1, Math.round((span / 7) * (m.daysPerWeek || 4)));
    });
    var left = all.filter(function (m) {
      if (m.status === "active") return false;
      var lv = G.lastVisit(m.id);
      return lv ? String(lv).slice(0, 7) === ym : String(m.joined).slice(0, 7) === ym;
    });
    return {
      ym: ym, revenue: G.revenue(ym), joined: joined.length, left: left.length,
      roster: roster.length, visits: visits,
      attendance: expect ? Math.round((visits / expect) * 100) : 0,
      churn: roster.length ? Math.round((left.length / roster.length) * 100) : 0,
      sessions: G.sessionsIn(null, start, end).length,
      volume: Math.round(M.sum(G.sessionsIn(null, start, end), function (x) { return G.sessionVolume(x); }))
    };
  };

  /* ---- fees ---- */
  var PLAN_MONTHS = { monthly: 1, quarterly: 3, halfyearly: 6, annual: 12 };
  M.PLAN_MONTHS = PLAN_MONTHS;
  G.payments = function (mid) {
    return M.store.gym.payments.filter(function (p) { return !mid || p.mid === mid; })
      .sort(function (a, b) { return a.d < b.d ? 1 : -1; });
  };
  G.addPayment = function (p) {
    p.id = p.id || M.uid("p");
    if (!p.rcpt) {
      var g = M.store.gym;
      g.rcptSeq = g.rcptSeq || 1;
      p.rcpt = "R" + String(new Date().getFullYear()).slice(2) + "-" + String(g.rcptSeq).padStart(4, "0");
      g.rcptSeq++;
    }
    M.store.gym.payments.push(p);
    M.save();
    return p;
  };
  G.payment = function (id) { return M.store.gym.payments.filter(function (p) { return p.id === id; })[0]; };
  G.delPayment = function (id) {
    M.store.gym.payments = M.store.gym.payments.filter(function (p) { return p.id !== id; });
    M.save();
  };
  G.paidUntil = function (m) {
    var months = M.sum(G.payments(m.id), function (p) { return +p.months || 0; });
    var base = M.parseK(m.joined || M.today());
    var d = M.addMonths(base, months);
    return M.keyOf(d);
  };
  G.dueDays = function (m) { return M.dayDiff(new Date(), G.paidUntil(m)); }; // negative = overdue
  G.feeState = function (m) {
    var dd = G.dueDays(m);
    if (dd < 0) return { k: "overdue", days: -dd, cls: "no", label: "Overdue " + -dd + "d" };
    if (dd <= 5) return { k: "due", days: dd, cls: "wn", label: dd === 0 ? "Due today" : "Due in " + dd + "d" };
    return { k: "ok", days: dd, cls: "ok", label: "Paid till " + M.fmtD(G.paidUntil(m), "dm") };
  };
  G.dues = function () {
    return G.active().map(function (m) { return { m: m, st: G.feeState(m) }; })
      .filter(function (x) { return x.st.k !== "ok"; })
      .sort(function (a, b) { return G.dueDays(a.m) - G.dueDays(b.m); });
  };
  G.revenue = function (ym) { // ym = "YYYY-MM"
    return M.sum(M.store.gym.payments.filter(function (p) { return String(p.d).slice(0, 7) === ym; }), function (p) { return +p.amt || 0; });
  };
  G.expectedMonthly = function () {
    return M.sum(G.active(), function (m) { return (+m.fee || 0) / (PLAN_MONTHS[m.plan] || 1); });
  };

  /* ---- labels ---- */
  M.LBL = {
    goal: { fatloss: "Fat loss", muscle: "Muscle gain", recomp: "Recomposition", strength: "Strength", endurance: "Endurance", fitness: "General fitness" },
    level: { first: "First-timer", ret: "Returning (late joiner)", beg: "Beginner", int: "Intermediate", adv: "Advanced" },
    activity: { sed: "Desk job / sedentary", light: "Lightly active", mod: "Moderately active", high: "Very active", ath: "Athlete / labour" },
    diet: { veg: "Vegetarian", egg: "Eggetarian", nonveg: "Non-vegetarian", vegan: "Vegan" },
    plan: { monthly: "Monthly", quarterly: "Quarterly", halfyearly: "6 months", annual: "Annual" },
    status: { active: "Active", paused: "On hold", left: "Left" },
    mode: { upi: "UPI", cash: "Cash", card: "Card", bank: "Bank transfer" },
    batch: { m6: "Morning 6-7", m7: "Morning 7-8", m8: "Morning 8-9", e5: "Evening 5-6", e6: "Evening 6-7", e7: "Evening 7-8", flex: "Flexible timing" },
    split: { push: "Push", pull: "Pull", legs: "Legs", upper: "Upper body", lower: "Lower body", full: "Full body", chestback: "Chest + Back", armsshoulders: "Arms + Shoulders", cardio: "Cardio / Conditioning", core: "Core" }
  };

  /* ============================================================
     DEMO DATA (fictional — for showing the product)
     ============================================================ */
  M.seedDemo = function () {
    var g = M.store.gym;
    var names = ["Rohit Verma", "Sneha Kapoor", "Imran Sheikh", "Priya Nair", "Aditya Rao", "Meera Joshi",
      "Karan Malhotra", "Fatima Ansari", "Vikram Shetty", "Ananya Das", "Deepak Yadav", "Ritu Bansal"];
    var goals = ["fatloss", "muscle", "recomp", "strength", "fitness", "fatloss", "muscle", "fatloss", "strength", "recomp", "muscle", "fitness"];
    var levels = ["first", "int", "adv", "ret", "beg", "first", "int", "beg", "adv", "int", "ret", "beg"];
    var diets = ["veg", "veg", "nonveg", "egg", "nonveg", "veg", "egg", "veg", "nonveg", "veg", "nonveg", "vegan"];
    var plans = ["monthly", "quarterly", "annual", "monthly", "quarterly", "monthly", "halfyearly", "monthly", "annual", "quarterly", "monthly", "monthly"];
    var fees = [1200, 3200, 10000, 1200, 3200, 1200, 5800, 1200, 10000, 3200, 1200, 1200];
    var rnd = M.rng("momentum-demo-v1");
    var today = new Date();

    /* never overwrite a real gym profile with demo branding */
    if (!g.profile.name) {
      g.profile.name = "Iron Yard Fitness";
      g.profile.capacity = g.profile.capacity || 60;
    }
    if (!g.profile.trainer) g.profile.trainer = M.store.settings.name || "Coach";

    names.forEach(function (nm, i) {
      var sex = /a$|i$|Sneha|Priya|Meera|Fatima|Ananya|Ritu/.test(nm.split(" ")[0]) && i % 2 === 1 ? "f" : (i % 3 === 1 ? "f" : "m");
      var joinedAgo = 20 + Math.floor(rnd() * 250);
      var joined = M.keyOf(M.addDays(today, -joinedAgo));
      var h = sex === "f" ? 152 + Math.floor(rnd() * 16) : 165 + Math.floor(rnd() * 18);
      var sw = Math.round((sex === "f" ? 55 + rnd() * 26 : 66 + rnd() * 32) * 10) / 10;
      var m = normMember({
        id: "demo" + i, name: nm, phone: "98" + String(10000000 + Math.floor(rnd() * 8999999)),
        sex: sex, dob: M.keyOf(new Date(today.getFullYear() - (20 + Math.floor(rnd() * 24)), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27))),
        joined: joined, level: levels[i], goal: goals[i], height: h, startWeight: sw,
        targetWeight: goals[i] === "fatloss" ? Math.round((sw - 6 - rnd() * 5) * 10) / 10 : goals[i] === "muscle" ? Math.round((sw + 4 + rnd() * 4) * 10) / 10 : 0,
        activity: ["sed", "light", "mod", "high"][Math.floor(rnd() * 4)],
        diet: diets[i], meals: 3 + Math.floor(rnd() * 3), daysPerWeek: 3 + Math.floor(rnd() * 4),
        plan: plans[i], fee: fees[i], status: i === 10 ? "paused" : "active",
        trainer: g.profile.trainer, notes: "", medical: i === 3 ? "Mild knee pain — avoid deep lunges" : ""
      });
      g.members.push(m);

      /* attendance + sessions + metrics for the last 10 weeks */
      var splits = m.daysPerWeek >= 5 ? ["push", "pull", "legs", "upper", "lower"] :
        m.daysPerWeek === 4 ? ["upper", "lower", "push", "pull"] : ["full", "full", "full"];
      var w = sw, day, k, si = 0;
      var span = Math.min(joinedAgo, 70);
      for (day = span; day >= 0; day--) {
        k = M.keyOf(M.addDays(today, -day));
        var dow = M.parseK(k).getDay();
        var attend = dow !== 0 && rnd() < (m.daysPerWeek / 6) * (m.status === "paused" && day < 14 ? 0 : 1) * (i === 7 ? .45 : 1);
        if (i === 5 && day < 11) attend = false; /* an at-risk member */
        if (!attend) continue;
        g.attendance[m.id] = g.attendance[m.id] || {};
        g.attendance[m.id][k] = 1;
        var split = splits[si++ % splits.length];
        var exs = M.EXDB.forSplit(split, m.level).slice(0, m.level === "first" ? 4 : m.level === "adv" ? 6 : 5);
        var base = m.level === "adv" ? 1.15 : m.level === "int" ? .85 : .55;
        var prog = 1 + (span - day) / span * (m.goal === "strength" ? .22 : .12);
        g.sessions.push({
          id: M.uid("s"), mid: m.id, d: k, split: split,
          dur: 45 + Math.floor(rnd() * 35), rpe: 6 + Math.floor(rnd() * 4), notes: "",
          ex: exs.map(function (ex) {
            var load = Math.max(2.5, M.round((ex.load || 20) * base * prog * (sex === "f" ? .68 : 1), 2.5));
            var reps = m.goal === "strength" ? 5 : m.goal === "fatloss" ? 13 : 9;
            var nsets = m.level === "first" ? 2 : m.level === "adv" ? 4 : 3;
            var sets = [], q;
            for (q = 0; q < nsets; q++) sets.push({ w: load, r: Math.max(3, reps - q + Math.floor(rnd() * 3) - 1) });
            return { name: ex.n, sets: sets };
          })
        });
      }
      /* weekly weight log trending toward the goal */
      var wk;
      for (wk = Math.floor(span / 7); wk >= 0; wk--) {
        var dk = M.keyOf(M.addDays(today, -wk * 7));
        var drift = m.goal === "fatloss" ? -.45 : m.goal === "muscle" ? .22 : 0;
        w = Math.round((sw + drift * (Math.floor(span / 7) - wk) + (rnd() - .5) * .5) * 10) / 10;
        var rec = { d: dk, w: w };
        if (wk % 4 === 0) {
          rec.neck = Math.round((sex === "f" ? 31 : 38) + rnd() * 2);
          rec.waist = Math.round((sex === "f" ? 74 : 84) + rnd() * 12 + drift * (Math.floor(span / 7) - wk));
          if (sex === "f") rec.hip = Math.round(94 + rnd() * 10);
          rec.chest = Math.round((sex === "f" ? 86 : 98) + rnd() * 8);
          rec.arm = Math.round((sex === "f" ? 26 : 32) + rnd() * 4);
          rec.thigh = Math.round((sex === "f" ? 52 : 55) + rnd() * 5);
        }
        g.metrics[m.id] = g.metrics[m.id] || [];
        g.metrics[m.id].push(rec);
      }
      /* payments: cover most of the membership, leave a couple pending */
      var pm = PLAN_MONTHS[m.plan], covered = 0, pd = m.joined;
      while (covered * 30 < joinedAgo - (i % 4 === 0 ? 40 : 0)) {
        g.payments.push({ id: M.uid("p"), mid: m.id, d: pd, amt: m.fee, months: pm, mode: ["cash", "upi", "upi", "card"][Math.floor(rnd() * 4)], note: "" });
        covered += pm;
        pd = M.keyOf(M.addMonths(M.parseK(pd), pm));
        if (pd > M.today()) break;
      }
    });
    M.saveNow();
  };
  M.clearDemo = function () {
    var g = M.store.gym;
    var ids = g.members.filter(function (m) { return /^demo/.test(m.id); }).map(function (m) { return m.id; });
    g.members = g.members.filter(function (m) { return ids.indexOf(m.id) < 0; });
    ids.forEach(function (id) { delete g.attendance[id]; delete g.metrics[id]; });
    g.sessions = g.sessions.filter(function (s) { return ids.indexOf(s.mid) < 0; });
    g.payments = g.payments.filter(function (p) { return ids.indexOf(p.mid) < 0; });
    M.saveNow();
    return ids.length;
  };
  M.hasDemo = function () { return M.store.gym.members.some(function (m) { return /^demo/.test(m.id); }); };
})(window);
