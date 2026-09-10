/* ============================================================
   Momentum · core.js — namespace, DOM/date/number helpers,
   icon set, SVG chart primitives
   ============================================================ */
(function (w) {
  "use strict";
  var M = (w.M = w.M || {});

  /* ---------------- DOM ---------------- */
  M.$ = function (s, r) { return (r || document).querySelector(s); };
  M.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  M.el = function (t, c, html) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (html != null) e.innerHTML = html;
    return e;
  };
  M.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  M.frag = function (html) { var t = document.createElement("template"); t.innerHTML = html; return t.content; };
  M.on = function (node, ev, sel, fn) {
    node.addEventListener(ev, function (e) {
      var t = e.target.closest(sel);
      if (t && node.contains(t)) fn(e, t);
    });
  };
  M.uid = function (p) { return (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  /* ---------------- dates ---------------- */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  M.MONTHS = MONTHS; M.MON = MON; M.DOW = DOW;
  M.keyOf = function (d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  M.today = function () { return M.keyOf(new Date()); };
  M.parseK = function (k) { var p = String(k).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  M.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  M.addMonths = function (d, n) { var x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  M.weekStart = function (d) { var x = new Date(d); var wd = (x.getDay() + 6) % 7; return M.addDays(x, -wd); };
  M.daysIn = function (y, m) { return new Date(y, m + 1, 0).getDate(); };
  M.dayDiff = function (a, b) { // whole days between date keys / dates
    var A = typeof a === "string" ? M.parseK(a) : new Date(a), B = typeof b === "string" ? M.parseK(b) : new Date(b);
    A.setHours(12, 0, 0, 0); B.setHours(12, 0, 0, 0);
    return Math.round((B - A) / 864e5);
  };
  M.fmtD = function (k, style) {
    if (!k) return "—";
    var d = typeof k === "string" ? M.parseK(k) : k;
    if (isNaN(d)) return "—";
    if (style === "long") return DOW[d.getDay()] + ", " + d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear();
    if (style === "dm") return d.getDate() + " " + MON[d.getMonth()];
    return d.getDate() + " " + MON[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
  };
  M.ago = function (k) {
    if (!k) return "never";
    var n = M.dayDiff(k, new Date());
    if (n <= 0) return "today";
    if (n === 1) return "yesterday";
    if (n < 7) return n + " days ago";
    if (n < 14) return "1 week ago";
    if (n < 60) return Math.round(n / 7) + " weeks ago";
    return Math.round(n / 30) + " months ago";
  };
  M.age = function (dob) {
    if (!dob) return null;
    var d = M.parseK(dob), n = new Date();
    var a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
    return a >= 0 && a < 120 ? a : null;
  };

  /* ---------------- numbers ---------------- */
  M.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  M.round = function (v, s) { s = s || 1; return Math.round(v / s) * s; };
  M.n1 = function (v) { return (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, ""); };
  M.pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
  M.sum = function (arr, f) { return arr.reduce(function (s, x) { return s + (f ? f(x) : x || 0); }, 0); };
  M.money = function (v) {
    var s = Math.round(v || 0).toString(), out = "", i;
    if (s.length > 3) {
      var last3 = s.slice(-3), rest = s.slice(0, -3), parts = [];
      while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
      if (rest) parts.unshift(rest);
      out = parts.join(",") + "," + last3;
    } else out = s;
    return "₹" + out;
  };
  M.signed = function (v, unit, dp) {
    var n = dp === 0 ? Math.round(v) : Math.round(v * 10) / 10;
    return (n > 0 ? "+" : "") + n + (unit || "");
  };
  M.initials = function (name) {
    var p = String(name || "?").trim().split(/\s+/);
    return ((p[0] || "")[0] || "?").toUpperCase() + (p.length > 1 ? (p[p.length - 1][0] || "").toUpperCase() : "");
  };
  /* deterministic colour from a string */
  var AVC = ["#4a5568", "#0f766e", "#7c5a3c", "#5b5f8f", "#166534", "#7c3f4f", "#3f5b7c", "#6b5b2f", "#2f6b5b", "#5b3f7c"];
  M.hueOf = function (s) {
    var h = 0, i;
    for (i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
    return AVC[h % AVC.length];
  };
  M.hexA = function (hex, a) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  };
  M.grade = function (p) { return p >= 75 ? "var(--ok)" : p >= 50 ? "var(--warn)" : "var(--no)"; };
  M.gradeHex = function (p) { return p >= 75 ? "#158f4b" : p >= 50 ? "#b8730a" : "#c92a2a"; };
  /* seeded RNG so generated plans stay stable per member */
  M.rng = function (seed) {
    var s = 0, i;
    for (i = 0; i < String(seed).length; i++) s = (s * 31 + String(seed).charCodeAt(i)) >>> 0;
    s = s || 7;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  };
  M.pickN = function (arr, n, rnd) {
    var a = arr.slice(), out = [];
    while (a.length && out.length < n) out.push(a.splice(Math.floor((rnd ? rnd() : Math.random()) * a.length), 1)[0]);
    return out;
  };

  /* ---------------- icons (24x24 stroke) ---------------- */
  var IC = {
    logo: "M12 2l3.2 6.4L22 9.6l-5 4.9 1.2 6.9L12 18.1 5.8 21.4 7 14.5 2 9.6l6.8-1.2z",
    home: "M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22v-8h6v8",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    chart: "M12 20V9M18 20V4M6 20v-6",
    activity: "M22 12h-4l-3 8-4-16-3 8H2",
    dumbbell: "M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.63a4 4 0 0 1 0 7.75",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
    clipboard: "M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1zM8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 12h6M9 16h4",
    utensils: "M4 2v7a3 3 0 0 0 6 0V2M7 12v10M17.5 2c-1.4 2-2 4-2 6s.6 4 2 4 2-2 2-4-.6-4-2-6M17.5 12v10",
    wallet: "M2 7h20v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zM2 7l3-4h14l3 4M16 13h3",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.26 19.4l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.09 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.74 1.51l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    x: "M18 6L6 18M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4L12 14.01l-3-3",
    chevR: "M9 18l6-6-6-6",
    chevL: "M15 18l-6-6 6-6",
    chevD: "M6 9l6 6 6-6",
    arrowL: "M19 12H5M12 19l-7-7 7-7",
    arrowUp: "M12 19V5M5 12l7-7 7 7",
    arrowDown: "M12 5v14M19 12l-7 7-7-7",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
    trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
    message: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z",
    flame: "M12 2.5s4.5 4.2 4.5 8.2a4.5 4.5 0 0 1-9 0c0-1.4.5-2.4.5-2.4S6 10.7 6 13.5a6 6 0 0 0 12 0c0-5.4-6-11-6-11z",
    target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    calendar: "M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 3v4M16 3v4M3 10h18",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6.5V12l4 2.2",
    trend: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    alert: "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4.5M12 17.2h.01",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4.5M12 8h.01",
    droplet: "M12 2.7l5.3 5.3a7.5 7.5 0 1 1-10.6 0z",
    award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 13.9L7 22l5-3 5 3-1.2-8.1",
    scale: "M12 3v18M4 7h16M7 7l-3 6h6zM17 7l-3 6h6zM8 21h8",
    ruler: "M2 8h20v8H2zM6 8v3M10 8v3M14 8v3M18 8v3",
    lock: "M5 11h14v11H5zM8 11V7a4 4 0 0 1 8 0v4",
    unlock: "M5 11h14v11H5zM8 11V7a4 4 0 0 1 7.5-2",
    refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15",
    star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
    copy: "M9 9h11v11H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
    menu: "M3 6h18M3 12h18M3 18h18",
    layers: "M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    zap: "M13 2L3 14h9l-1 8 10-12h-9z",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.9 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
    play: "M6 3l14 9-14 9z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    brain: "M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V15a3 3 0 0 0 3 3h.5A2.5 2.5 0 0 0 12 20.5V4.5A1.5 1.5 0 0 0 10.5 3zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V15a3 3 0 0 1-3 3h-.5A2.5 2.5 0 0 1 12 20.5",
    apple: "M12 7c0-2.5 2-4.5 4.5-4.5M8.5 7C6 7 4 9.4 4 12.9S6.5 21 9 21c1.2 0 2-.6 3-.6s1.8.6 3 .6c2.5 0 5-4.6 5-8.1S17 7 15.5 7c-1.3 0-2.3.7-3.5.7S9.8 7 8.5 7z",
    seed: "M12 22V12M12 12C8 12 5 9 5 5c4 0 7 3 7 7zM12 12c4 0 7-3 7-7-4 0-7 3-7 7z"
  };
  M.IC = IC;
  M.icon = function (name, cls) {
    var d = IC[name];
    if (!d) d = IC.info;
    return '<svg class="' + (cls || "") + '" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  };

  /* ============================================================
     SVG chart primitives (no libraries)
     ============================================================ */

  /* area / line chart with optional baseline + grid */
  M.areaChart = function (vals, o) {
    o = o || {};
    var pts = vals.filter(function (v) { return v != null; });
    if (pts.length < 2) return M.chartEmpty(o.empty || "Not enough data yet.");
    var W = 300, H = 100, pad = 2;
    var max = o.max != null ? o.max : Math.max.apply(null, pts);
    var min = o.min != null ? o.min : Math.min.apply(null, pts);
    if (max === min) { max = max + 1; min = min - 1; }
    var color = o.color || "#0f766e";
    var n = vals.length;
    var X = function (i) { return pad + (i / (n - 1)) * (W - pad * 2); };
    var Y = function (v) { return H - pad - ((v - min) / (max - min)) * (H - pad * 2); };
    var line = "", area = "", started = false, first = null, last = null, i;
    for (i = 0; i < n; i++) {
      if (vals[i] == null) continue;
      var x = X(i), y = Y(vals[i]);
      line += (started ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2) + " ";
      if (!started) first = x;
      last = x; started = true;
    }
    area = line + "L" + last + " " + (H - pad) + " L" + first + " " + (H - pad) + " Z";
    var grid = "";
    if (o.grid !== false) {
      [0, .25, .5, .75, 1].forEach(function (f) {
        var y = pad + f * (H - pad * 2);
        grid += '<line x1="0" y1="' + y.toFixed(1) + '" x2="' + W + '" y2="' + y.toFixed(1) + '" stroke="var(--grid-line)" stroke-width=".6" vector-effect="non-scaling-stroke"/>';
      });
    }
    var goal = "";
    if (o.goal != null && o.goal >= min && o.goal <= max) {
      goal = '<line x1="0" y1="' + Y(o.goal).toFixed(1) + '" x2="' + W + '" y2="' + Y(o.goal).toFixed(1) + '" stroke="' + (o.goalColor || "var(--muted-2)") + '" stroke-width="1" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>';
    }
    var dots = "";
    if (o.dots) {
      for (i = 0; i < n; i++) if (vals[i] != null) dots += '<circle cx="' + X(i).toFixed(2) + '" cy="' + Y(vals[i]).toFixed(2) + '" r="1.7" fill="' + color + '" vector-effect="non-scaling-stroke"/>';
    }
    return '<svg class="chart' + (o.cls ? " " + o.cls : "") + '" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">'
      + grid + goal
      + (o.fill === false ? "" : '<path d="' + area + '" fill="' + color + '" opacity=".16"/>')
      + '<path d="' + line.trim() + '" fill="none" stroke="' + color + '" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>'
      + dots + "</svg>";
  };

  /* multi-series line */
  M.multiLine = function (series, o) {
    o = o || {};
    var W = 300, H = 100, pad = 3, n = o.len || (series[0] && series[0].vals.length) || 0;
    var all = [];
    series.forEach(function (s) { s.vals.forEach(function (v) { if (v != null) all.push(v); }); });
    if (all.length < 2) return M.chartEmpty(o.empty || "Log a few days to compare.");
    var max = o.max != null ? o.max : Math.max.apply(null, all);
    var min = o.min != null ? o.min : Math.min.apply(null, all);
    if (max === min) { max += 1; min -= 1; }
    var paths = "", grid = "";
    [0, .5, 1].forEach(function (f) {
      var y = pad + f * (H - pad * 2);
      grid += '<line x1="0" y1="' + y.toFixed(1) + '" x2="' + W + '" y2="' + y.toFixed(1) + '" stroke="var(--grid-line)" stroke-width=".6" vector-effect="non-scaling-stroke"/>';
    });
    series.forEach(function (s) {
      var d = "", pen = false, i;
      for (i = 0; i < n; i++) {
        var v = s.vals[i];
        if (v == null) { pen = false; continue; }
        var x = pad + (n > 1 ? i / (n - 1) : 0) * (W - pad * 2);
        var y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
        d += (pen ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2) + " ";
        pen = true;
      }
      if (d) paths += '<path d="' + d.trim() + '" fill="none" stroke="' + s.color + '" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>';
    });
    return '<svg class="chart' + (o.cls ? " " + o.cls : "") + '" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' + grid + paths + "</svg>";
  };

  /* donut: data [{label,value,color}] */
  M.donut = function (data, o) {
    o = o || {};
    var total = M.sum(data, function (d) { return d.value; });
    var R = 50, r = o.thin ? 36 : 32, C = 60, seg = "", a0 = -Math.PI / 2;
    if (!total) return '<svg class="donut" viewBox="0 0 120 120"><circle cx="60" cy="60" r="41" fill="none" stroke="var(--track)" stroke-width="' + (R - r) + '"/></svg>';
    data.forEach(function (d) {
      if (!d.value) return;
      var a1 = a0 + (d.value / total) * Math.PI * 2;
      var large = a1 - a0 > Math.PI ? 1 : 0;
      var x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0), x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
      var xi1 = C + r * Math.cos(a1), yi1 = C + r * Math.sin(a1), xi0 = C + r * Math.cos(a0), yi0 = C + r * Math.sin(a0);
      seg += '<path d="M' + x0.toFixed(2) + " " + y0.toFixed(2) + " A" + R + " " + R + " 0 " + large + " 1 " + x1.toFixed(2) + " " + y1.toFixed(2)
        + " L" + xi1.toFixed(2) + " " + yi1.toFixed(2) + " A" + r + " " + r + " 0 " + large + " 0 " + xi0.toFixed(2) + " " + yi0.toFixed(2) + ' Z" fill="' + d.color + '"/>';
      a0 = a1;
    });
    var mid = o.center ? '<text x="60" y="58" text-anchor="middle" font-size="17" font-weight="600" fill="var(--ink)">' + M.esc(o.center) + '</text>'
      + '<text x="60" y="72" text-anchor="middle" font-size="8.5" fill="var(--muted)" letter-spacing="1">' + M.esc(o.centerSub || "") + "</text>" : "";
    return '<svg class="donut" viewBox="0 0 120 120">' + seg + mid + "</svg>";
  };

  /* progress ring */
  M.ring = function (pct, o) {
    o = o || {};
    var r = 45, c = 2 * Math.PI * r, off = c * (1 - M.clamp(pct, 0, 100) / 100);
    return '<svg viewBox="0 0 100 100">'
      + '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="var(--track)" stroke-width="' + (o.w || 8) + '"/>'
      + '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + (o.color || "var(--accent)") + '" stroke-width="' + (o.w || 8) + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" style="transition:stroke-dashoffset .6s var(--ease-out)"/>'
      + "</svg>";
  };

  /* column chart from [{label,value,color?,hi?}] */
  M.columns = function (data, o) {
    o = o || {};
    var max = o.max != null ? o.max : Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var h = "";
    data.forEach(function (d) {
      var pc = max ? (d.value / max) * 100 : 0;
      h += '<div class="b' + (d.hi ? " hi" : "") + '"><div class="col" style="height:' + Math.max(2, pc) + "%" + (d.color ? ";background:" + d.color : "") + '">'
        + (o.showVal === false ? "" : '<div class="pc">' + (o.fmt ? o.fmt(d.value) : d.value) + "</div>")
        + '</div><div class="dy">' + M.esc(d.label) + "</div></div>";
    });
    return '<div class="bars"' + (o.style ? ' style="' + o.style + '"' : "") + ">" + h + "</div>";
  };

  M.chartEmpty = function (msg) {
    return '<div style="display:grid;place-items:center;height:120px;color:var(--muted-2);font-size:12px;text-align:center;padding:0 12px;">' + M.esc(msg) + "</div>";
  };

  M.emptyState = function (icon, title, body, actionHtml) {
    return '<div class="empty"><div class="eic">' + M.icon(icon) + "</div><b>" + M.esc(title) + "</b>"
      + (body ? "<p>" + M.esc(body) + "</p>" : "") + (actionHtml || "") + "</div>";
  };

  /* download helper */
  M.download = function (text, name, type) {
    var blob = new Blob([text], { type: type || "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = M.$("#dlAnchor") || document.body.appendChild(M.el("a", "dl-anchor"));
    a.id = "dlAnchor"; a.href = url; a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  };
  M.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var ta = M.el("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { }
    ta.remove();
    return Promise.resolve();
  };
  M.wa = function (phone, text) {
    var p = String(phone || "").replace(/[^0-9]/g, "");
    if (p.length === 10) p = "91" + p;
    return "https://wa.me/" + p + "?text=" + encodeURIComponent(text);
  };
  M.csvCell = function (v) {
    var s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
})(window);
