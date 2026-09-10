/* ============================================================
   Momentum · report.js
   #/report/:id  — printable, brandable one-page client report
   #/business    — month-on-month business report for the owner
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, G = M.G, L = M.LBL;
  var VIEWS = (M.VIEWS = M.VIEWS || {});

  function brand() {
    var p = M.store.gym.profile;
    return {
      name: p.name || "Momentum",
      trainer: p.trainer || M.store.settings.name || "",
      phone: p.phone || "",
      city: p.city || ""
    };
  }
  function head(title, sub) {
    var b = brand();
    return '<div class="rep-head">'
      + '<div class="rep-brand"><div class="mark">' + M.icon("dumbbell") + "</div>"
      + "<div><b>" + M.esc(b.name) + "</b><span>"
      + [b.trainer, b.phone, b.city].filter(Boolean).map(M.esc).join(" · ") + "</span></div></div>"
      + '<div class="rep-title"><h2>' + M.esc(title) + "</h2><span>" + M.esc(sub) + "</span></div>"
      + "</div>";
  }
  function box(v, l, note) {
    return '<div class="rep-box"><b>' + v + "</b><span>" + M.esc(l) + "</span>"
      + (note ? "<i>" + M.esc(note) + "</i>" : "") + "</div>";
  }
  function sect(title, inner, cls) {
    return '<div class="rep-sect' + (cls ? " " + cls : "") + '"><h3>' + M.esc(title) + "</h3>" + inner + "</div>";
  }

  /* ============================================================
     CLIENT REPORT
     ============================================================ */
  VIEWS.report = function (host, id) {
    var m = G.byId(id);
    if (!m) { host.innerHTML = '<div class="glass card">' + M.emptyState("user", "Member not found", "") + "</div>"; return; }
    var T = M.NUT.targets(m);
    var mets = G.metrics(id), last = G.latest(id);
    var wt = G.weight(m), dl = G.weightDelta(m), bmi = G.bmi(m), bf = G.bodyFat(m);
    var proj = G.projection(m);
    var prs = G.prs(id).slice(0, 6);
    var wser = mets.filter(function (r) { return r.w; }).slice(-14);
    var now = new Date();
    var att = [], i;
    for (i = 7; i >= 0; i--) {
      var ws = M.weekStart(M.addDays(now, -i * 7));
      var n = G.visitsIn(id, M.keyOf(ws), M.keyOf(M.addDays(ws, 6))).length;
      att.push({ label: i === 0 ? "now" : "-" + i, value: n, color: n >= (m.daysPerWeek || 4) ? "var(--ok)" : n ? "var(--warn)" : "var(--track)" });
    }
    var plan = m.dietPlan || M.NUT.plan(m);
    var day = plan.days[0];

    host.innerHTML =
      '<div class="rep-bar no-print">'
      + '<button class="btn" data-route="#/member/' + id + '">' + M.icon("arrowL") + "<span>Back to profile</span></button>"
      + '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">'
      + '<button class="btn" id="repWa">' + M.icon("message") + "<span>Send summary</span></button>"
      + '<button class="btn primary" id="repPrint">' + M.icon("print") + "<span>Print / save as PDF</span></button>"
      + "</div></div>"

      + '<div class="report" id="reportSheet">'
      + head("Progress report", m.name + " · " + M.fmtD(M.today(), "long"))

      + '<div class="rep-grid5">'
      + box(M.esc(L.goal[m.goal]), "Goal")
      + box(M.esc(L.level[m.level]), "Level")
      + box(M.esc(L.plan[m.plan]), "Plan", G.feeState(m).label)
      + box(M.dayDiff(m.joined, now) + "<small> days</small>", "With us", "since " + M.fmtD(m.joined))
      + box(G.attPct(id) + "<small>%</small>", "Attendance", G.visits(id).length + " visits")
      + "</div>"

      + sect("Body composition",
        '<div class="rep-grid5">'
        + box(M.n1(wt) + "<small> kg</small>", "Current weight", M.signed(dl, " kg") + " since joining")
        + box(M.n1(m.startWeight) + "<small> kg</small>", "Start weight")
        + box(M.n1(bmi), "BMI", G.bmiLabel(bmi))
        + box(bf != null ? bf + "<small>%</small>" : "—", "Body fat", bf != null ? "Navy method" : "add neck + waist")
        + box(m.targetWeight ? M.n1(m.targetWeight) + "<small> kg</small>" : "—", "Target",
          proj && proj.eta ? "on track for " + M.fmtD(proj.eta, "dm") : proj && proj.done ? "reached" : proj && proj.stalled ? "stalled" : "")
        + "</div>"
        + (wser.length > 1
          ? M.areaChart(wser.map(function (r) { return r.w; }), { color: "#0f766e", goal: m.targetWeight || null, dots: true })
          + '<div class="rep-axis"><span>' + M.fmtD(wser[0].d, "dm") + "</span><span>" + M.fmtD(wser[wser.length - 1].d, "dm") + "</span></div>"
          : '<div class="rep-note">Not enough weigh-ins yet to draw a trend.</div>'))

      + sect("Attendance · last 8 weeks", M.columns(att, { max: Math.max(m.daysPerWeek || 4, Math.max.apply(null, att.map(function (a) { return a.value; }))), style: "height:120px" }))

      + (prs.length ? sect("Strength records",
        '<table class="rep-tbl"><thead><tr><th>Exercise</th><th class="r">Best set</th><th class="r">Estimated 1RM</th><th class="r">When</th></tr></thead><tbody>'
        + prs.map(function (p) {
          return "<tr><td>" + M.esc(p.name) + '</td><td class="r">' + M.n1(p.wt) + " kg × " + p.reps
            + '</td><td class="r">' + M.n1(p.e1) + ' kg</td><td class="r">' + M.fmtD(p.d, "dm") + "</td></tr>";
        }).join("") + "</tbody></table>") : "")

      + (m.program ? sect("Training plan · " + m.program.name,
        '<div class="rep-cols">' + m.program.days.map(function (d) {
          return "<div><b>" + M.esc(d.day) + " · " + M.esc(d.name) + "</b><ol>"
            + d.ex.map(function (e) { return "<li>" + M.esc(e.name) + " <span>" + e.sets + " × " + M.esc(e.reps) + "</span></li>"; }).join("")
            + "</ol></div>";
        }).join("") + "</div>"
        + '<div class="rep-note"><b>Cardio:</b> ' + M.esc(m.program.cardio) + "</div>") : "")

      + sect("Nutrition targets",
        '<div class="rep-grid5">'
        + box(T.kcal, "kcal / day", T.deficit > 0 ? "deficit " + T.deficit : T.deficit < 0 ? "surplus " + (-T.deficit) : "maintenance")
        + box(T.protein + "<small> g</small>", "Protein", T.perKg + " g/kg")
        + box(T.carbs + "<small> g</small>", "Carbs")
        + box(T.fat + "<small> g</small>", "Fat")
        + box((T.water / 1000).toFixed(1) + "<small> L</small>", "Water", "fibre " + T.fibre + " g")
        + "</div>"
        + '<table class="rep-tbl"><tbody>'
        + day.meals.map(function (ml) {
          return "<tr><td style=\"width:130px\"><b>" + M.esc(ml.label) + "</b><div class=\"sub\">" + M.esc(ml.time) + "</div></td>"
            + "<td>" + ml.items.map(function (it) { return M.esc(it.name) + " — " + M.esc(it.qty); }).join(" · ") + "</td>"
            + '<td class="r" style="width:78px">' + ml.totals.kcal + " kcal</td></tr>";
        }).join("") + "</tbody></table>")

      + sect("Coach notes",
        '<ul class="rep-list">' + plan.notes.slice(0, 4).map(function (n) { return "<li>" + M.esc(n) + "</li>"; }).join("")
        + (m.medical ? '<li><b>Medical note:</b> ' + M.esc(m.medical) + "</li>" : "")
        + G.notes(id).slice(0, 3).map(function (n) { return "<li>" + M.fmtD(n.d, "dm") + " — " + M.esc(n.t) + "</li>"; }).join("")
        + "</ul>")

      + '<div class="rep-foot">' + M.esc(brand().name) + (brand().trainer ? " · " + M.esc(brand().trainer) : "")
      + " · report generated " + M.fmtD(M.today(), "long")
      + '<span>Momentum</span></div>'
      + "</div>";

    M.$("#repPrint", host).onclick = function () { w.print(); };
    M.$("#repWa", host).onclick = function () {
      var b = brand();
      var lines = [
        "*" + m.name + " — progress summary*",
        M.fmtD(M.today(), "long"),
        "",
        "Weight: " + M.n1(wt) + " kg (" + M.signed(dl, " kg") + " since joining)",
        "BMI: " + M.n1(bmi) + " · " + G.bmiLabel(bmi),
        bf != null ? "Body fat: " + bf + "%" : "",
        m.targetWeight ? "Target: " + M.n1(m.targetWeight) + " kg" + (proj && proj.eta ? " — on track for " + M.fmtD(proj.eta, "dm") : "") : "",
        "Attendance: " + G.attPct(id) + "% (" + G.visits(id).length + " visits)",
        prs.length ? "Top lift: " + prs[0].name + " " + M.n1(prs[0].wt) + " kg × " + prs[0].reps : "",
        "",
        "Daily targets: " + T.kcal + " kcal · " + T.protein + " g protein · " + T.carbs + " g carbs · " + T.fat + " g fat",
        "",
        "— " + b.name + (b.trainer ? " · " + b.trainer : "")
      ].filter(Boolean);
      var txt = lines.join("\n");
      if (m.phone) w.open(M.wa(m.phone, txt), "_blank");
      else M.copy(txt).then(function () { M.toast("Summary copied — no phone on file", "ok"); });
    };
  };

  /* ============================================================
     PAYMENT RECEIPT (modal, printable)
     ============================================================ */
  M.receipt = function (pid) {
    var p = G.payment(pid); if (!p) return;
    var m = G.byId(p.mid) || { name: "(deleted member)", plan: "monthly", phone: "" };
    var b = brand();
    var html = '<div class="report receipt" id="receiptSheet">'
      + head("Payment receipt", "No. " + (p.rcpt || "—") + " · " + M.fmtD(p.d, "long"))
      + '<table class="rep-tbl"><tbody>'
      + row("Received from", M.esc(m.name) + (m.phone ? " · " + M.esc(m.phone) : ""))
      + row("Membership", M.esc(L.plan[m.plan] || "") + " · " + p.months + " month" + (p.months === 1 ? "" : "s"))
      + row("Valid till", M.fmtD(G.paidUntil(m), "long"))
      + row("Mode", M.esc(L.mode[p.mode] || p.mode || ""))
      + (p.note ? row("Note", M.esc(p.note)) : "")
      + '<tr><td><b>Amount paid</b></td><td class="r"><b style="font-size:16px">' + M.money(p.amt) + "</b></td></tr>"
      + "</tbody></table>"
      + '<div class="rep-note">Thank you. Keep this receipt for your records.</div>'
      + '<div class="rep-foot">' + M.esc(b.name) + (b.trainer ? " · " + M.esc(b.trainer) : "") + (b.phone ? " · " + M.esc(b.phone) : "") + "<span>Momentum</span></div>"
      + "</div>";
    M.modal({
      title: "Receipt " + (p.rcpt || ""), wide: true, body: html,
      footer: [
        {
          label: "WhatsApp", cls: "", icon: "message", fn: function () {
            var txt = ["*Payment receipt* " + (p.rcpt || ""), b.name, "",
              "Received from: " + m.name,
              "Amount: " + M.money(p.amt) + " (" + (L.mode[p.mode] || p.mode) + ")",
              "Membership: " + (L.plan[m.plan] || "") + " · " + p.months + " month(s)",
              "Valid till: " + M.fmtD(G.paidUntil(m), "long"),
              "Date: " + M.fmtD(p.d, "long"), "", "Thank you!"].join("\n");
            if (m.phone) w.open(M.wa(m.phone, txt), "_blank");
            else M.copy(txt).then(function () { M.toast("Receipt copied", "ok"); });
          }
        },
        { label: "Print", cls: "primary", icon: "print", fn: function () { printOnly("receiptSheet"); } }
      ]
    });
  };
  function row(k, v) { return "<tr><td style=\"width:150px;color:var(--muted)\">" + M.esc(k) + '</td><td class="r">' + v + "</td></tr>"; }
  /* print a single element by isolating it */
  function printOnly(id) {
    var el = document.getElementById(id);
    if (!el) { w.print(); return; }
    document.body.classList.add("print-isolate");
    el.classList.add("print-target");
    w.print();
    setTimeout(function () {
      document.body.classList.remove("print-isolate");
      el.classList.remove("print-target");
    }, 600);
  }
  M.printOnly = printOnly;

  /* ============================================================
     BUSINESS REPORT
     ============================================================ */
  VIEWS.business = function (host) {
    var all = G.all();
    if (!all.length) {
      host.innerHTML = '<div class="glass card">' + M.emptyState("chart", "No data to report on yet",
        "Add members (or load the demo gym) and the business report fills itself in.",
        '<div style="display:flex;gap:8px;margin-top:12px;justify-content:center;flex-wrap:wrap">'
        + '<button class="btn primary" data-act="addmember">' + M.icon("plus") + "<span>Add member</span></button>"
        + '<button class="btn" data-act="demo">' + M.icon("layers") + "<span>Load demo gym</span></button></div>") + "</div>";
      return;
    }
    var now = new Date(), months = [], i;
    for (i = 11; i >= 0; i--) {
      var d = M.addMonths(now, -i);
      months.push(G.monthStats(M.keyOf(d).slice(0, 7)));
    }
    var cur = months[months.length - 1], prev = months[months.length - 2] || cur;
    function delta(a, b) {
      if (!b) return null;
      var pc = Math.round(((a - b) / Math.abs(b)) * 100);
      return { cls: pc >= 0 ? "up" : "down", txt: M.signed(pc, "%", 0) + " vs last month" };
    }
    var lifetime = M.sum(G.payments(null), function (p) { return +p.amt || 0; });
    var avgFee = G.active().length ? Math.round(G.expectedMonthly() / G.active().length) : 0;
    var retained = all.filter(function (m) { return m.status === "active" && M.dayDiff(m.joined, now) > 90; }).length;

    /* leaderboards */
    var byAtt = G.active().map(function (m) { return { m: m, v: G.attPct(m.id) }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    var wkFrom = M.keyOf(M.addDays(now, -27));
    var byVol = G.active().map(function (m) {
      return { m: m, v: Math.round(M.sum(G.sessionsIn(m.id, wkFrom, M.today()), function (s) { return G.sessionVolume(s); }) / 1000) };
    }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    var byRev = G.all().map(function (m) {
      return { m: m, v: M.sum(G.payments(m.id), function (p) { return +p.amt || 0; }) };
    }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);

    var levelMix = {}, goalMix = {};
    G.active().forEach(function (m) {
      levelMix[m.level] = (levelMix[m.level] || 0) + 1;
      goalMix[m.goal] = (goalMix[m.goal] || 0) + 1;
    });
    var LC = { first: "#4d7c8a", ret: "#7c5a3c", beg: "#0f766e", int: "#5b5f8f", adv: "#b45309" };
    var GC = { fatloss: "#c2410c", muscle: "#0f766e", recomp: "#5b5f8f", strength: "#b45309", endurance: "#0369a1", fitness: "#64748b" };

    host.innerHTML =
      '<div class="kpis kpis-4">'
      + kpi("wallet", "Revenue this month", M.money(cur.revenue), delta(cur.revenue, prev.revenue))
      + kpi("users", "New joins", String(cur.joined), delta(cur.joined, prev.joined))
      + kpi("clock", "Left / paused", String(cur.left), cur.churn ? { cls: "down", txt: cur.churn + "% churn" } : { cls: "up", txt: "no churn" })
      + kpi("activity", "Attendance rate", cur.attendance + "%", delta(cur.attendance, prev.attendance))
      + kpi("dumbbell", "Sessions logged", String(cur.sessions), delta(cur.sessions, prev.sessions))
      + kpi("award", "Lifetime collected", M.money(lifetime), { cls: "flat-c", txt: G.payments(null).length + " payments" })
      + kpi("trend", "Avg fee / member", M.money(avgFee), { cls: "flat-c", txt: G.active().length + " active plans" })
      + kpi("heart", "Retained 90+ days", String(retained), { cls: "flat-c", txt: M.pct(retained, Math.max(G.all().length, 1)) + "% of roster" })
      + "</div>"

      + '<div class="pgrid">'
      + card("chart", "Revenue", "last 12 months", M.columns(months.map(function (x, ix) {
        return {
          label: M.MON[M.parseK(x.ym + "-01").getMonth()], value: x.revenue,
          hi: ix === months.length - 1, color: ix === months.length - 1 ? "var(--accent)" : "var(--info)"
        };
      }), { fmt: function (v) { return v >= 1000 ? Math.round(v / 1000) + "k" : v; }, style: "height:170px" }), "span2")

      + card("users", "Joins vs leavers", "last 12 months",
        '<div class="legend"><span><i style="background:#0f766e"></i>Joined</span><span><i style="background:#c92a2a"></i>Left / paused</span></div>'
        + M.multiLine([
          { vals: months.map(function (x) { return x.joined; }), color: "#0f766e" },
          { vals: months.map(function (x) { return x.left; }), color: "#c92a2a" }
        ], { len: 12, min: 0 }), "span2")

      + card("activity", "Attendance trend", "% of planned sessions attended",
        M.areaChart(months.map(function (x) { return x.attendance; }), { color: "#b45309", min: 0, max: 100, dots: true }))

      + card("target", "Goal mix", "active members", '<div class="donut-wrap">'
        + M.donut(Object.keys(goalMix).map(function (k) { return { label: L.goal[k], value: goalMix[k], color: GC[k] }; }),
          { center: String(G.active().length), centerSub: "ACTIVE" })
        + '<div class="donut-lg">' + Object.keys(goalMix).map(function (k) {
          return '<div class="dl"><i style="background:' + GC[k] + '"></i><span>' + M.esc(L.goal[k]) + "</span><b>" + goalMix[k] + "</b></div>";
        }).join("") + "</div></div>")

      + card("layers", "Experience mix", "active members", '<div class="donut-wrap">'
        + M.donut(Object.keys(levelMix).map(function (k) { return { label: L.level[k], value: levelMix[k], color: LC[k] }; }),
          { center: String(G.active().length), centerSub: "ACTIVE" })
        + '<div class="donut-lg">' + Object.keys(levelMix).map(function (k) {
          return '<div class="dl"><i style="background:' + LC[k] + '"></i><span>' + M.esc(L.level[k]) + "</span><b>" + levelMix[k] + "</b></div>";
        }).join("") + "</div></div>")

      + card("award", "Most consistent", "attendance · last 4 weeks", lead(byAtt, function (x) { return x.v + "%"; }, 100))
      + card("dumbbell", "Highest volume", "tonnes · last 4 weeks", lead(byVol, function (x) { return x.v + " t"; }))
      + card("wallet", "Top lifetime value", "total paid", lead(byRev, function (x) { return M.money(x.v); }))

      + '<div class="glass card full"><div class="card-h"><div class="ic">' + M.icon("list") + '</div>'
      + '<div><h3>Month by month</h3><span class="sub">last 12 months</span></div>'
      + '<div class="acts"><button class="btn sm" id="expBiz">' + M.icon("download") + "<span>CSV</span></button></div></div>"
      + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Month</th><th class="r">Revenue</th><th class="r">Joined</th>'
      + '<th class="r">Left</th><th class="r">Roster</th><th class="r">Visits</th><th class="r">Attendance</th><th class="r">Churn</th>'
      + '<th class="r">Sessions</th><th class="r">Tonnage</th></tr></thead><tbody>'
      + months.slice().reverse().map(function (x) {
        var d = M.parseK(x.ym + "-01");
        return "<tr><td><b>" + M.MON[d.getMonth()] + " " + String(d.getFullYear()).slice(2) + '</b></td>'
          + '<td class="r">' + M.money(x.revenue) + '</td><td class="r">' + x.joined + '</td><td class="r">' + x.left
          + '</td><td class="r">' + x.roster + '</td><td class="r">' + x.visits + '</td><td class="r">' + x.attendance
          + '%</td><td class="r">' + x.churn + '%</td><td class="r">' + x.sessions + '</td><td class="r">' + Math.round(x.volume / 1000) + " t</td></tr>";
      }).join("") + "</tbody></table></div></div>"
      + "</div>";

    M.$("#expBiz", host).onclick = function () {
      var rows = [["month", "revenue", "joined", "left", "roster", "visits", "attendance_pct", "churn_pct", "sessions", "volume_kg"]];
      months.forEach(function (x) {
        rows.push([x.ym, x.revenue, x.joined, x.left, x.roster, x.visits, x.attendance, x.churn, x.sessions, x.volume]);
      });
      M.download(rows.map(function (r) { return r.map(M.csvCell).join(","); }).join("\n"), "momentum-business-" + M.today() + ".csv", "text/csv");
      M.toast("Business report exported", "ok");
    };
  };

  function kpi(icon, label, value, dd) {
    return '<div class="glass kpi"><div class="l">' + M.icon(icon) + "<span>" + M.esc(label) + '</span></div><div class="v">' + value + "</div>"
      + (dd ? '<div class="d ' + dd.cls + '">' + M.esc(dd.txt) + "</div>" : "") + "</div>";
  }
  function card(icon, title, sub, inner, cls) {
    return '<div class="glass card' + (cls ? " " + cls : "") + '"><div class="card-h"><div class="ic">' + M.icon(icon) + "</div><div><h3>"
      + M.esc(title) + '</h3><span class="sub">' + M.esc(sub) + "</span></div></div>" + inner + "</div>";
  }
  function lead(arr, fmt, forced) {
    if (!arr.length || !arr[0].v) return M.chartEmpty("Not enough data yet.");
    var max = forced || arr[0].v || 1;
    return '<div class="rows">' + arr.map(function (x, i) {
      return '<div class="row" style="cursor:pointer" data-open="' + x.m.id + '"><span class="rk">' + (i + 1) + "</span>"
        + M.gymAv(x.m, "sm")
        + '<span class="nm" style="flex:1">' + M.esc(x.m.name) + "</span>"
        + '<span class="trk"><i style="width:' + M.clamp((x.v / max) * 100, 0, 100) + '%;background:var(--info)"></i></span>'
        + '<span class="val">' + M.esc(fmt(x)) + "</span></div>";
    }).join("") + "</div>";
  }
})(window);
