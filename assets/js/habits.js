/* ============================================================
   Momentum · habits.js — personal module views
   Today · Habit Grid (matrix + mental state) · Insights
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, H = M.H;
  var VIEWS = (M.VIEWS = M.VIEWS || {});
  var gridRef = new Date(); gridRef.setDate(1);
  var filter = "";
  var lastAction = null;
  M.setHabitFilter = function (q) { filter = String(q || "").trim().toLowerCase(); };

  var GROUPS = [["build", "Build — do it"], ["quit", "Quit — avoid it"], ["count", "Count — tally"]];
  var weekIdx = function (d) { return Math.floor((d - 1) / 7); };

  /* ============================================================
     TODAY
     ============================================================ */
  VIEWS.today = function (host) {
    var tk = M.today(), A = H.active();
    var done = H.dayDone(tk), pct = H.dayPct(tk);
    var q = M.QUOTES[new Date().getDate() % M.QUOTES.length];
    var best = 0, longest = 0;
    A.forEach(function (h) { best = Math.max(best, H.streak(h)); longest = Math.max(longest, H.best(h)); });
    var d = new Date();

    var vals = [], i;
    for (i = 13; i >= 0; i--) { var dk = M.keyOf(M.addDays(d, -i)); vals.push(H.hasData(dk) ? H.dayPct(dk) : 0); }

    host.innerHTML =
      '<div class="today-hero">'
      + '<div class="glass hero">'
      + '<div class="dstamp"><b>' + d.getDate() + " " + M.MON[d.getMonth()] + "</b><span>" + M.DOW[d.getDay()] + " · " + d.getFullYear() + "</span></div>"
      + '<div class="ringwrap">'
      + '<div class="ring">' + M.ring(pct, { color: pct >= 100 ? "var(--ok)" : "var(--accent)" })
      + '<div class="mid"><b>' + pct + '%</b><span>today</span></div></div>'
      + '<div class="stats" style="flex:1;min-width:180px">'
      + sbox(done + '<small>/' + A.length + "</small>", "Habits done")
      + sbox(best + "<small> d</small>", "Active streak")
      + sbox(H.overall() + "<small> d</small>", "Perfect run")
      + sbox(longest + "<small> d</small>", "Best ever")
      + "</div></div>"
      + '<div class="divider"></div>'
      + '<div class="quote">“' + M.esc(q[0]) + '”<b>— ' + M.esc(q[1]) + "</b></div>"
      + '<div><div class="legend"><span><i class="sq" style="background:var(--accent)"></i>Last 14 days · daily completion</span></div>'
      + M.areaChart(vals, { color: "#0f766e", max: 100, min: 0, cls: "short" }) + "</div>"
      + "</div>"

      + '<div class="glass card">'
      + '<div class="card-h"><div class="ic">' + M.icon("checkCircle") + '</div><div><h3>Today’s checklist</h3><span class="sub">Tap to cycle · done → missed → clear</span></div></div>'
      + '<div class="checklist" id="ckList"></div>'
      + '<div class="divider"></div>'
      + '<div class="card-h" style="margin:0 0 12px"><div class="ic">' + M.icon("brain") + '</div><div><h3>Mental state</h3><span class="sub">Rate today 1–10</span></div></div>'
      + '<div class="mood-set" id="moodSet"></div>'
      + "</div></div>";

    var list = M.$("#ckList", host);
    if (!A.length) list.innerHTML = M.emptyState("seed", "No habits yet", "Add your first habit to start tracking.", '<button class="btn primary" style="margin-top:8px" data-act="addhabit">' + M.icon("plus") + "<span>New habit</span></button>");
    A.forEach(function (h) {
      var v = H.val(tk, h.id);
      var ok = H.isSuccess(h, v), marked = H.isMarked(h, v);
      var cls = "ck" + (ok ? " done" : marked ? " miss" : "");
      var right = h.t === "count"
        ? (marked ? v + " today" : "not logged")
        : (ok ? "done" : marked ? "missed" : "pending");
      var row = M.el("div", cls);
      row.innerHTML = '<span class="emo">' + h.e + '</span><span class="nm">' + M.esc(h.n) + "</span>"
        + '<span class="sub">' + M.esc(right) + (h.g ? " · " + H.weekProgress(h) + "/" + h.g + " wk" : "") + "</span>"
        + '<span class="bdg' + (H.streak(h) ? " wn" : "") + '">' + M.icon("flame") + H.streak(h) + "</span>";
      row.onclick = function () { lastAction = H.apply(h.id, tk, "cycle"); M.rerender(); };
      row.oncontextmenu = function (e) { e.preventDefault(); H.apply(h.id, tk, "clear"); M.rerender(); };
      list.appendChild(row);
    });

    var ms = M.$("#moodSet", host);
    M.MIND_ROWS.forEach(function (r) {
      var cur = (M.store.mind[tk] || {})[r[0]];
      var row = M.el("div", "mood-row");
      var sc = "";
      for (i = 1; i <= 10; i++) {
        sc += '<b data-m="' + r[0] + '" data-v="' + i + '"' + (cur === i ? ' class="on" style="background:' + M.gradeHex((i / 10) * 100) + '"' : "") + ">" + i + "</b>";
      }
      row.innerHTML = '<span class="lb">' + r[2] + " " + r[1] + '</span><span class="scale">' + sc + "</span>";
      ms.appendChild(row);
    });
    M.on(ms, "click", "b[data-m]", function (e, t) {
      H.applyMind(t.dataset.m, tk, "set", +t.dataset.v);
      M.rerender();
    });
  };
  function sbox(v, l) { return '<div class="sbox"><div class="v">' + v + '</div><div class="l">' + M.esc(l) + "</div></div>"; }

  /* ============================================================
     GRID  (habit matrix + mental state matrix)
     ============================================================ */
  VIEWS.grid = function (host) {
    host.innerHTML =
      '<div class="glass mnav">'
      + '<button class="icb" id="prevM">' + M.icon("chevL") + "</button>"
      + '<h2 id="monthTitle">—</h2>'
      + '<button class="icb" id="nextM">' + M.icon("chevR") + "</button>"
      + '<button class="btn sm" id="todayBtn">' + M.icon("target") + "<span>Today</span></button>"
      + '<div class="lg-inline">'
      + '<span><span class="lc" style="background:linear-gradient(150deg,var(--ok),var(--ok-2))">' + M.icon("check") + "</span>Done</span>"
      + '<span><span class="lc" style="background:linear-gradient(150deg,var(--no),var(--no-2))">' + M.icon("x") + "</span>Missed</span>"
      + '<span><b>Click</b> cycles · <b>right-click</b> clears</span>'
      + "</div></div>"
      + '<div class="glass mx-wrap" id="mxWrap"></div>'
      + '<div class="sect"><h2>Mental state</h2><div class="line"></div><span style="font-size:11px;color:var(--muted)">Mood · Motivation · Day score (1–10)</span></div>'
      + '<div class="glass mx-wrap auto" id="mindWrap"></div>';

    M.$("#prevM", host).onclick = function () { gridRef = new Date(gridRef.getFullYear(), gridRef.getMonth() - 1, 1); VIEWS.grid(host); };
    M.$("#nextM", host).onclick = function () { gridRef = new Date(gridRef.getFullYear(), gridRef.getMonth() + 1, 1); VIEWS.grid(host); };
    M.$("#todayBtn", host).onclick = function () { gridRef = new Date(); gridRef.setDate(1); VIEWS.grid(host); };
    renderMatrix(host);
    renderMind(host);
  };

  function dayHead(y, m, dim, corner) {
    var tk = M.today(), h = '<thead><tr><th class="corner">' + M.esc(corner) + "</th>", d;
    for (d = 1; d <= dim; d++) {
      var dt = new Date(y, m, d), dk = M.keyOf(dt), wd = dt.getDay();
      var tint = M.WEEKTINTS[weekIdx(d)] || M.WEEKTINTS[0];
      h += '<th class="day' + (dk === tk ? " today" : "") + (wd === 0 || wd === 6 ? " wknd" : "") + '">'
        + '<div class="dw">' + M.DOW[wd] + '</div><div class="dn">' + d + "</div>"
        + '<div class="wk" style="background:' + M.hexA(tint, .8) + '"></div></th>';
    }
    return h + "</tr></thead>";
  }

  function renderMatrix(host) {
    var wrap = M.$("#mxWrap", host);
    var y = gridRef.getFullYear(), m = gridRef.getMonth(), dim = M.daysIn(y, m), tk = M.today();
    M.$("#monthTitle", host).textContent = M.MONTHS[m] + " " + y;
    var list = H.active();
    if (filter) list = list.filter(function (h) { return h.n.toLowerCase().indexOf(filter) >= 0; });
    if (!list.length) {
      wrap.innerHTML = M.emptyState("seed", filter ? "No habit matches that search" : "No habits yet",
        filter ? "Clear the search to see everything." : "Add a habit to start the grid.",
        '<button class="btn primary" style="margin-top:8px" data-act="addhabit">' + M.icon("plus") + "<span>New habit</span></button>");
      return;
    }
    var now = new Date(new Date().setHours(23, 59, 59, 999));
    var h = '<table class="mx">' + dayHead(y, m, dim, "Habit (" + list.length + ")") + "<tbody>";
    GROUPS.forEach(function (g) {
      var rows = list.filter(function (x) { return x.t === g[0]; });
      if (!rows.length) return;
      h += '<tr class="grp"><th>' + g[1] + "</th>" + rep("<td></td>", dim) + "</tr>";
      rows.forEach(function (hb) {
        var sub = '<span class="fire">' + H.streak(hb) + "d</span>";
        if (hb.g > 0) sub += '<span class="goal">' + H.weekProgress(hb) + "/" + hb.g + " wk</span>";
        h += '<tr data-id="' + hb.id + '"><th class="hname"><div class="hrow">'
          + '<span class="cdot" style="background:' + hb.c + '"></span><span class="emo">' + hb.e + "</span>"
          + '<span class="meta"><span class="nm">' + M.esc(hb.n) + '</span><span class="sub">' + sub + "</span></span>"
          + '<span class="acts"><div data-mv="up" title="Move up">' + M.icon("arrowUp") + "</div>"
          + '<div data-mv="down" title="Move down">' + M.icon("arrowDown") + "</div>"
          + '<div data-edit="1" title="Edit">' + M.icon("edit") + "</div></span></div></th>";
        var d;
        for (d = 1; d <= dim; d++) {
          var dt = new Date(y, m, d), dk = M.keyOf(dt), wd = dt.getDay();
          h += '<td class="cell' + (dk === tk ? " today" : "") + (wd === 0 || wd === 6 ? " wknd" : "") + (dt > now ? " fut" : "")
            + '" data-dk="' + dk + '" data-id="' + hb.id + '">' + cellHtml(hb, H.val(dk, hb.id)) + "</td>";
        }
        h += "</tr>";
      });
    });
    h += '<tr class="foot"><th>Day %</th>';
    var d2;
    for (d2 = 1; d2 <= dim; d2++) {
      var dk2 = M.keyOf(new Date(y, m, d2));
      h += '<td class="' + (dk2 === tk ? "today" : "") + '">' + (H.hasData(dk2) ? H.dayPct(dk2) + "%" : "·") + "</td>";
    }
    h += "</tr></tbody></table>";
    wrap.innerHTML = h;
    var th = wrap.querySelector("thead th.today");
    if (th) wrap.scrollLeft = th.offsetLeft - 260;

    wrap.onclick = function (e) {
      var td = e.target.closest("td.cell");
      if (td) {
        lastAction = H.apply(td.dataset.id, td.dataset.dk, "cycle");
        renderMatrix(host); M.renderKpis();
        var cell = wrap.querySelector('td.cell[data-dk="' + td.dataset.dk + '"][data-id="' + td.dataset.id + '"] .dotb');
        if (cell) cell.classList.add("pop");
        M.toast("Marked", "ok", "Undo", function () { H.undo(lastAction); renderMatrix(host); M.renderKpis(); });
        return;
      }
      var act = e.target.closest("[data-mv],[data-edit]");
      if (act) {
        var id = e.target.closest("tr").dataset.id;
        if (act.dataset.edit) M.habitModal(id);
        else { moveHabit(id, act.dataset.mv); renderMatrix(host); }
      }
    };
    wrap.oncontextmenu = function (e) {
      var td = e.target.closest("td.cell");
      if (td) { e.preventDefault(); H.apply(td.dataset.id, td.dataset.dk, "clear"); renderMatrix(host); M.renderKpis(); }
    };
  }
  function rep(s, n) { var o = "", i; for (i = 0; i < n; i++) o += s; return o; }
  function cellHtml(h, v) {
    if (h.t === "count") {
      if (v == null) return '<div class="dotb"></div>';
      if (v === 0) return '<div class="dotb c0"><span class="n">0</span></div>';
      return '<div class="dotb cn"><span class="n">' + v + "</span></div>";
    }
    if (v === 1) return '<div class="dotb ok">' + M.icon("check") + "</div>";
    if (v === 0) return '<div class="dotb no">' + M.icon("x") + "</div>";
    return '<div class="dotb"></div>';
  }
  function moveHabit(id, dir) {
    var hs = M.store.habits, i = hs.map(function (h) { return h.id; }).indexOf(id);
    if (i < 0) return;
    var j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= hs.length) return;
    var t = hs[i]; hs[i] = hs[j]; hs[j] = t;
    M.save();
  }

  function renderMind(host) {
    var wrap = M.$("#mindWrap", host);
    var y = gridRef.getFullYear(), m = gridRef.getMonth(), dim = M.daysIn(y, m), tk = M.today();
    var now = new Date(new Date().setHours(23, 59, 59, 999));
    var h = '<table class="mx">' + dayHead(y, m, dim, "Mental state") + "<tbody>";
    M.MIND_ROWS.forEach(function (r) {
      h += '<tr data-metric="' + r[0] + '"><th class="mname"><div class="hrow"><span class="emo">' + r[2] + "</span>"
        + '<span class="meta"><span class="nm">' + r[1] + '</span><span class="sub">1–10</span></span></div></th>';
      var d;
      for (d = 1; d <= dim; d++) {
        var dt = new Date(y, m, d), dk = M.keyOf(dt), wd = dt.getDay();
        var v = (M.store.mind[dk] || {})[r[0]];
        var style = v == null ? "" : ' style="background:' + M.hexA(M.gradeHex((v / 10) * 100), .9) + ';border-color:transparent"';
        h += '<td class="mcell' + (dk === tk ? " today" : "") + (wd === 0 || wd === 6 ? " wknd" : "") + (dt > now ? " fut" : "")
          + '" data-dk="' + dk + '" data-metric="' + r[0] + '"><div class="mchip' + (v == null ? " e" : "") + '"' + style + ">" + (v == null ? "·" : v) + "</div></td>";
      }
      h += "</tr>";
    });
    h += '<tr class="foot"><th>Mindset %</th>';
    var d2;
    for (d2 = 1; d2 <= dim; d2++) {
      var dk = M.keyOf(new Date(y, m, d2)), p = H.mindPct(dk);
      h += '<td class="' + (dk === tk ? "today" : "") + '">' + (p != null ? p + "%" : "·") + "</td>";
    }
    h += "</tr></tbody></table>";
    wrap.innerHTML = h;
    var th = wrap.querySelector("thead th.today");
    if (th) wrap.scrollLeft = th.offsetLeft - 260;
    wrap.onclick = function (e) {
      var td = e.target.closest("td.mcell");
      if (td && !td.classList.contains("fut")) { H.applyMind(td.dataset.metric, td.dataset.dk, "cycle"); renderMind(host); M.renderKpis(); }
    };
    wrap.oncontextmenu = function (e) {
      var td = e.target.closest("td.mcell");
      if (td) { e.preventDefault(); H.applyMind(td.dataset.metric, td.dataset.dk, "clear"); renderMind(host); M.renderKpis(); }
    };
  }

  /* ============================================================
     INSIGHTS
     ============================================================ */
  VIEWS.insights = function (host) {
    var A = H.active(), tk = M.today(), now = new Date();
    var y = now.getFullYear(), m = now.getMonth(), dim = M.daysIn(y, m), td = now.getDate();

    /* week columns */
    var cols = [], i;
    for (i = 6; i >= 0; i--) {
      var d = M.addDays(now, -i), dk = M.keyOf(d), pc = H.dayPct(dk);
      cols.push({ label: M.DOW[d.getDay()], value: pc, hi: dk === tk, color: pc >= 75 ? "var(--ok)" : pc >= 50 ? "var(--warn)" : pc > 0 ? "var(--no)" : "var(--track)" });
    }
    /* month trend */
    var trend = [];
    for (i = 1; i <= td; i++) { var dk2 = M.keyOf(new Date(y, m, i)); trend.push(H.hasData(dk2) ? H.dayPct(dk2) : 0); }
    /* mind series */
    var mood = [], mot = [];
    for (i = 1; i <= dim; i++) {
      var mm = M.store.mind[M.keyOf(new Date(y, m, i))] || {};
      mood.push(mm.mood != null ? mm.mood : null); mot.push(mm.mot != null ? mm.mot : null);
    }
    var weeks = Math.ceil(dim / 7), wcols = [];
    for (i = 0; i < weeks; i++) {
      var pc2 = H.weekMindAvg(y, m, i);
      wcols.push({ label: "W" + (i + 1), value: pc2, color: M.grade(pc2) });
    }

    host.innerHTML =
      '<div class="pgrid">'
      + card("chart", "Weekly progress", "last 7 days · daily completion", M.columns(cols, { max: 100, fmt: function (v) { return v + "%"; } }))
      + card("calendar", M.MONTHS[m] + " heatmap", "darker = better day", heatHtml(y, m))
      + card("flame", "Streak leaderboard", "current run per habit", rowsHtml(A.map(function (h) {
        return { h: h, v: H.streak(h) };
      }).sort(function (a, b) { return b.v - a.v; }), function (x, max) {
        return { emo: x.h.e, nm: x.h.n, w: max ? (x.v / max) * 100 : 0, c: x.h.c, val: x.v + " d" };
      }))
      + card("trend", "This month · per habit", "completion %", rowsHtml(A.map(function (h) {
        return { h: h, v: H.monthPct(h) };
      }).sort(function (a, b) { return b.v - a.v; }), function (x) {
        return { emo: x.h.e, nm: x.h.n, w: x.v, c: M.gradeHex(x.v), val: x.v + "%" };
      }, 100))
      + '<div class="glass card span2"><div class="card-h"><div class="ic">' + M.icon("activity") + '</div><div><h3>' + M.MONTHS[m] + " trend</h3><span class=\"sub\">daily completion %</span></div></div>"
      + M.areaChart(trend, { color: "#0f766e", min: 0, max: 100 }) + "</div>"
      + '<div class="glass card span2"><div class="card-h"><div class="ic">' + M.icon("brain") + '</div><div><h3>Mental state</h3><span class="sub">mindset by week · mood vs motivation</span></div>'
      + '<div class="acts"><span class="bdg ac">' + H.mindMonthAvg() + "% avg</span></div></div>"
      + '<div class="grid2">'
      + "<div>" + M.columns(wcols, { max: 100, fmt: function (v) { return v + "%"; } }) + "</div>"
      + '<div><div class="legend"><span><i style="background:' + M.MOOD_COLOR + '"></i>Mood</span><span><i style="background:' + M.MOT_COLOR + '"></i>Motivation</span></div>'
      + M.multiLine([{ vals: mood, color: M.MOOD_COLOR }, { vals: mot, color: M.MOT_COLOR }], { len: dim, min: 1, max: 10 }) + "</div>"
      + "</div></div>"
      + "</div>";
  };
  function card(icon, title, sub, inner, cls) {
    return '<div class="glass card' + (cls ? " " + cls : "") + '"><div class="card-h"><div class="ic">' + M.icon(icon) + "</div><div><h3>" + M.esc(title) + '</h3><span class="sub">' + M.esc(sub) + "</span></div></div>" + inner + "</div>";
  }
  function rowsHtml(arr, map, forcedMax) {
    if (!arr.length) return M.chartEmpty("No habits yet.");
    var max = forcedMax || Math.max.apply(null, arr.map(function (x) { return x.v; }).concat([1]));
    return '<div class="rows">' + arr.map(function (x) {
      var r = map(x, max);
      return '<div class="row"><span style="font-size:15px;width:20px;text-align:center">' + r.emo + '</span>'
        + '<span class="nm" style="flex:0 0 118px">' + M.esc(r.nm) + '</span>'
        + '<span class="trk"><i style="width:' + M.clamp(r.w, 0, 100) + "%;background:" + r.c + '"></i></span>'
        + '<span class="val">' + M.esc(r.val) + "</span></div>";
    }).join("") + "</div>";
  }
  function heatHtml(y, m) {
    var tk = M.today(), first = new Date(y, m, 1).getDay(), dim = M.daysIn(y, m), i;
    var h = '<div class="heat">';
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (x) { h += '<div class="hd">' + x + "</div>"; });
    for (i = 0; i < first; i++) h += '<div class="hc e"></div>';
    for (i = 1; i <= dim; i++) {
      var dk = M.keyOf(new Date(y, m, i)), style = "";
      if (H.hasData(dk)) {
        var pc = H.dayPct(dk), a = .14 + (pc / 100) * .78;
        style = ' style="background:rgba(21,143,75,' + a.toFixed(2) + ")" + (pc > 55 ? ";color:#fff" : "") + '"';
      }
      h += '<div class="hc' + (dk === tk ? " t" : "") + '"' + style + ">" + i + "</div>";
    }
    return h + "</div>";
  }

  /* ============================================================
     habit add/edit modal
     ============================================================ */
  M.habitModal = function (id) {
    var h = id ? H.byId(id) : null;
    var pick = h ? h.c : M.COLORS[0];
    var body = '<div class="grid2">'
      + M.f.text("e", "Emoji", h ? h.e : "✨", { attr: ' maxlength="2" style="text-align:center;font-size:18px"' })
      + M.f.text("n", "Habit name", h ? h.n : "", { req: true, ph: "e.g. Gym" })
      + "</div>"
      + '<div class="grid2">'
      + M.f.sel("t", "Type", h ? h.t : "build", [["build", "Build — do it (✓ = done)"], ["quit", "Quit — avoid it (✓ = stayed clean)"], ["count", "Count — tally (e.g. cups)"]])
      + M.f.num("g", "Weekly goal", h && h.g ? h.g : "", { min: 0, max: 7, ph: "0 = none" })
      + "</div>"
      + '<div class="fld"><label>Colour</label><div class="pills" id="swBox">'
      + M.COLORS.map(function (c) {
        return '<button type="button" class="pill" data-c="' + c + '" style="width:30px;height:30px;padding:0;border-radius:9px;background:' + c + (c === pick ? ";outline:2px solid var(--ink);outline-offset:2px" : "") + '"></button>';
      }).join("") + "</div></div>";

    var foot = [{
      label: h ? "Save changes" : "Add habit", cls: "primary", icon: "check", fn: function (b) {
        var v = M.formVals(b);
        if (!v.n) { M.toast("Give the habit a name", "no"); return; }
        if (h) Object.assign(h, { n: v.n, e: v.e || "✨", t: v.t, g: +v.g || 0, c: pick });
        else M.store.habits.push({ id: M.uid("h"), n: v.n, e: v.e || "✨", t: v.t, c: pick, g: +v.g || 0, arch: false });
        M.save(); M.closeModal(); M.rerender();
        M.toast(h ? "Habit updated" : "Habit added", "ok");
      }
    }];
    if (h) {
      foot.unshift({
        label: "Archive", cls: "ghost", icon: "trash", fn: function () {
          h.arch = true; M.save(); M.closeModal(); M.rerender(); M.toast("Archived — restore from Settings", "ok");
        }
      });
    }
    M.modal({
      title: h ? "Edit habit" : "New habit",
      sub: "Keep it small and unambiguous — that is what makes it stick.",
      body: body, footer: foot,
      onOpen: function (b) {
        M.on(M.$("#swBox", b), "click", "[data-c]", function (e, t) {
          pick = t.dataset.c;
          M.$$("[data-c]", b).forEach(function (x) { x.style.outline = x.dataset.c === pick ? "2px solid var(--ink)" : ""; x.style.outlineOffset = "2px"; });
        });
      }
    });
  };
})(window);
