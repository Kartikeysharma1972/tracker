/* ============================================================
   Momentum · gym.js — Gym Studio: overview, member roster,
   member profile
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, G = M.G, L = M.LBL;
  var VIEWS = (M.VIEWS = M.VIEWS || {});
  var mFilter = { q: "", status: "active", goal: "", level: "", view: "cards", sort: "name" };
  M.mFilter = mFilter;

  /* ---------------- small builders ---------------- */
  function av(m, size) {
    var st = m.status === "active" ? "a" : m.status === "paused" ? "p" : "x";
    return '<div class="av' + (size ? " " + size : "") + '" style="background:linear-gradient(150deg,' + M.hueOf(m.name) + "," + M.hexA(M.hueOf(m.name), .72) + ')">'
      + M.esc(M.initials(m.name)) + '<i class="st ' + st + '"></i></div>';
  }
  function card(icon, title, sub, inner, cls, acts) {
    return '<div class="glass card' + (cls ? " " + cls : "") + '"><div class="card-h"><div class="ic">' + M.icon(icon) + "</div>"
      + "<div><h3>" + M.esc(title) + '</h3><span class="sub">' + (sub || "") + "</span></div>"
      + (acts ? '<div class="acts">' + acts + "</div>" : "") + "</div>" + inner + "</div>";
  }
  function kpi(icon, label, value, detail, bar, color) {
    return '<div class="glass kpi"><div class="l">' + M.icon(icon) + "<span>" + M.esc(label) + "</span></div>"
      + '<div class="v">' + value + "</div>"
      + (detail ? '<div class="d">' + detail + "</div>" : "")
      + (bar != null ? '<div class="bar"><i style="width:' + M.clamp(bar, 0, 100) + "%" + (color ? ";background:" + color : "") + '"></i></div>' : "")
      + "</div>";
  }
  function sbox(v, l, dd) {
    return '<div class="sbox"><div class="v">' + v + '</div><div class="l">' + M.esc(l) + "</div>"
      + (dd ? '<div class="dd ' + dd.cls + '">' + dd.txt + "</div>" : "") + "</div>";
  }
  M.gymAv = av;

  /* ============================================================
     GYM OVERVIEW
     ============================================================ */
  VIEWS.gym = function (host) {
    var all = G.all(), act = G.active(), tk = M.today(), now = new Date();
    var ym = tk.slice(0, 7);
    if (!all.length) {
      host.innerHTML = '<div class="glass card">' + M.emptyState("users", "No members yet",
        "Add your first member, or load a demo gym with 12 members, 10 weeks of attendance, workouts and payments to see everything working.",
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center">'
        + '<button class="btn primary" data-act="addmember">' + M.icon("plus") + "<span>Add member</span></button>"
        + '<button class="btn" data-act="demo">' + M.icon("layers") + "<span>Load demo gym</span></button></div>") + "</div>";
      return;
    }

    /* KPIs */
    var inToday = G.checkinsOn(tk);
    var wkStart = M.keyOf(M.addDays(now, -6));
    var visits7 = M.sum(act, function (m) { return G.visitsIn(m.id, wkStart, tk).length; });
    var expect7 = M.sum(act, function (m) { return m.daysPerWeek || 4; });
    var rev = G.revenue(ym);
    var dues = G.dues();
    var duesAmt = M.sum(dues, function (d) { return +d.m.fee || 0; });
    var risk = G.atRisk(7);
    var renew = G.expiring(10);
    var prs = G.prsSince(M.keyOf(M.addDays(now, -7)));
    var joinedThisMonth = all.filter(function (m) { return m.joined.slice(0, 7) === ym; }).length;

    /* check-ins over 14 days */
    var cols = [], i;
    for (i = 13; i >= 0; i--) {
      var d = M.addDays(now, -i), dk = M.keyOf(d), n = G.checkinsOn(dk);
      cols.push({ label: i % 2 === 0 || i === 0 ? String(d.getDate()) : "", value: n, hi: dk === tk, color: dk === tk ? "var(--accent)" : "var(--info)" });
    }
    /* goal mix */
    var goalMix = {};
    act.forEach(function (m) { goalMix[m.goal] = (goalMix[m.goal] || 0) + 1; });
    var GC = { fatloss: "#c2410c", muscle: "#0f766e", recomp: "#5b5f8f", strength: "#b45309", endurance: "#0369a1", fitness: "#64748b" };
    var mix = Object.keys(goalMix).map(function (k) { return { label: L.goal[k] || k, value: goalMix[k], color: GC[k] || "#64748b" }; })
      .sort(function (a, b) { return b.value - a.value; });
    /* gym tonnage last 8 weeks */
    var tons = [], wl;
    for (i = 7; i >= 0; i--) {
      var ws = M.weekStart(M.addDays(now, -i * 7));
      var from = M.keyOf(ws), to = M.keyOf(M.addDays(ws, 6));
      tons.push(Math.round(M.sum(G.sessionsIn(null, from, to), function (s) { return G.sessionVolume(s); }) / 1000));
    }
    /* muscle popularity this week */
    var load = {};
    act.forEach(function (m) {
      var ml = G.muscleLoad(m.id, wkStart, tk);
      Object.keys(ml).forEach(function (k) { load[k] = (load[k] || 0) + ml[k].sets; });
    });
    var mus = Object.keys(load).map(function (k) { return { k: k, v: Math.round(load[k]) }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 8);

    host.innerHTML =
      '<div class="kpis kpis-4">'
      + kpi("users", "Active members", act.length + '<small> / ' + all.length + "</small>", joinedThisMonth + " joined this month", M.pct(act.length, Math.max(all.length, 1)))
      + kpi("checkCircle", "Check-ins today", String(inToday), M.pct(inToday, Math.max(act.length, 1)) + "% of active roster", M.pct(inToday, Math.max(act.length, 1)), "var(--ok)")
      + kpi("activity", "Weekly attendance", M.pct(visits7, Math.max(expect7, 1)) + "<small>%</small>", visits7 + " of " + expect7 + " planned sessions", M.pct(visits7, Math.max(expect7, 1)), M.grade(M.pct(visits7, Math.max(expect7, 1))))
      + kpi("wallet", "Collected this month", M.money(rev), "expected " + M.money(G.expectedMonthly()), M.pct(rev, Math.max(G.expectedMonthly(), 1)), "var(--info)")
      + kpi("alert", "Fees pending", String(dues.length), duesAmt ? M.money(duesAmt) + " outstanding" : "all clear", dues.length ? 100 : 0, dues.length ? "var(--no)" : "var(--ok)")
      + kpi("clock", "At risk (7d absent)", String(risk.length), risk.length ? "needs a nudge today" : "everyone is showing up", risk.length ? 100 : 0, risk.length ? "var(--warn)" : "var(--ok)")
      + kpi("award", "PRs this week", String(prs.length), prs.length ? prs[0].member.name.split(" ")[0] + " leads" : "no new records yet", Math.min(100, prs.length * 12), "var(--warn)")
      + kpi("refresh", "Renewals due (10d)", String(renew.length), renew.length ? M.money(M.sum(renew, function (x) { return +x.m.fee || 0; })) + " to collect" : "nothing expiring", renew.length ? 100 : 0, "var(--info)")
      + "</div>"

      + '<div class="pgrid">'
      + card("calendar", "Check-ins", "last 14 days", M.columns(cols, { style: "height:170px" }), "span2")
      + card("target", "Goal mix", "active members", '<div class="donut-wrap">' + M.donut(mix, { center: String(act.length), centerSub: "MEMBERS" })
        + '<div class="donut-lg">' + mix.map(function (x) {
          return '<div class="dl"><i style="background:' + x.color + '"></i><span>' + M.esc(x.label) + "</span><b>" + x.value + "</b></div>";
        }).join("") + "</div></div>")
      + card("checkCircle", "Today’s floor", "search a name, hit enter, done · grouped by batch", quickBar() + rosterHtml(act, tk), "span2")
      + card("alert", "Needs a nudge", "no visit in 7+ days", riskHtml(risk))
      + card("trend", "Gym tonnage", "last 8 weeks · tonnes lifted", M.areaChart(tons, { color: "#0f766e", min: 0, dots: true }) + weekAxis(8), "span2")
      + card("dumbbell", "Muscle groups trained", "sets this week across the gym", mus.length ? '<div class="muscle-bars">' + mus.map(function (x) {
        var max = mus[0].v || 1;
        return '<div class="mb"><span class="mn">' + M.esc(M.EXDB.label(x.k)) + '</span><span class="mt"><i style="width:' + (x.v / max) * 100 + "%;background:" + M.EXDB.color(x.k) + '"></i></span><span class="mv">' + x.v + " sets</span></div>";
      }).join("") + "</div>" : M.chartEmpty("Log a workout to see muscle coverage."))
      + card("wallet", "Fees due & overdue", dues.length + " member" + (dues.length === 1 ? "" : "s"), duesHtml(dues), "span2")
      + card("refresh", "Renewals coming up", "next 10 days", renewHtml(renew))
      + "</div>";

    wireQuick(host, tk);
  };

  /* ---------------- quick check-in ---------------- */
  function quickBar() {
    return '<div class="qbar no-print">'
      + '<div class="search"><span>' + M.icon("search") + '</span>'
      + '<input id="qcin" placeholder="Quick check-in — type a name or phone, press Enter"></div>'
      + '<span class="kb">/</span></div><div class="qhits" id="qhits"></div>';
  }
  function wireQuick(host, tk) {
    var inp = M.$("#qcin", host), hits = M.$("#qhits", host);
    if (!inp) return;
    var matches = [];
    function draw() {
      var q = inp.value.trim().toLowerCase();
      matches = !q ? [] : G.active().filter(function (m) {
        return (m.name + " " + (m.phone || "")).toLowerCase().indexOf(q) >= 0;
      }).slice(0, 6);
      if (!matches.length) { hits.innerHTML = q ? '<div class="hint" style="padding:4px 2px">No active member matches that.</div>' : ""; return; }
      hits.innerHTML = matches.map(function (m, i) {
        var inn = G.isIn(m.id, tk);
        return '<button class="qhit" data-q="' + m.id + '">' + av(m, "sm")
          + '<span style="min-width:0;flex:1"><span class="nm">' + M.esc(m.name) + "</span>"
          + '<span class="sub"> · ' + M.esc(L.batch[m.batch] || "") + "</span></span>"
          + '<span class="bdg ' + (inn ? "ok" : "") + '">' + (inn ? "already in" : "check in") + "</span>"
          + (i === 0 ? '<span class="kb">↵</span>' : "") + "</button>";
      }).join("");
    }
    inp.oninput = draw;
    inp.onkeydown = function (e) {
      if (e.key === "Enter" && matches.length) {
        e.preventDefault();
        doCheck(matches[0]);
      }
    };
    hits.onclick = function (e) {
      var t = e.target.closest("[data-q]");
      if (!t) return;
      e.stopPropagation();
      var m = G.byId(t.dataset.q);
      if (m) doCheck(m);
    };
    function doCheck(m) {
      var on = G.toggleIn(m.id, tk);
      M.toast(m.name.split(" ")[0] + (on ? " checked in" : " check-in removed"), "ok");
      M.rerender();
      var again = M.$("#qcin");
      if (again) again.focus();
    }
  }
  function renewHtml(list) {
    if (!list.length) return '<div class="note in">Nothing expiring in the next 10 days.</div>';
    return '<div class="rows">' + list.map(function (x) {
      return '<div class="row"><span data-open="' + x.m.id + '" style="flex:1;min-width:0;cursor:pointer">'
        + '<span class="nm" style="display:block">' + M.esc(x.m.name) + "</span>"
        + '<span class="sub">' + M.esc(L.plan[x.m.plan]) + " · " + M.money(x.m.fee) + "</span></span>"
        + '<span class="bdg ' + (x.days <= 3 ? "wn" : "") + '">' + (x.days === 0 ? "today" : "in " + x.days + "d") + "</span>"
        + '<button class="icb sm" data-pay="' + x.m.id + '" title="Record renewal">' + M.icon("wallet") + "</button></div>";
    }).join("") + "</div>";
  }

  function weekAxis(n) {
    var h = '<div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--muted-2);margin-top:6px">', i;
    for (i = n - 1; i >= 0; i--) h += "<span>" + (i === 0 ? "this wk" : "-" + i + "w") + "</span>";
    return h + "</div>";
  }
  function rosterHtml(list, tk) {
    if (!list.length) return M.chartEmpty("No active members.");
    var order = Object.keys(L.batch), html = "";
    order.forEach(function (b) {
      var arr = list.filter(function (m) { return (m.batch || "flex") === b; }).sort(function (a, b2) { return a.name.localeCompare(b2.name); });
      if (!arr.length) return;
      var inN = arr.filter(function (m) { return G.isIn(m.id, tk); }).length;
      html += '<div class="batch-h"><b>' + M.esc(L.batch[b]) + '</b><i></i><span class="cnt">'
        + inN + " / " + arr.length + " in</span></div>" + rosterRows(arr, tk);
    });
    return html;
  }
  function rosterRows(arr, tk) {
    return '<div class="rows">' + arr.map(function (m) {
      var inn = G.isIn(m.id, tk);
      return '<div class="row"><span data-open="' + m.id + '" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:pointer">'
        + av(m, "sm") + '<span style="min-width:0"><span class="nm" style="display:block">' + M.esc(m.name) + "</span>"
        + '<span class="sub">' + M.esc(L.goal[m.goal] || "") + " · last " + M.esc(M.ago(G.lastVisit(m.id))) + "</span></span></span>"
        + '<button class="btn sm ' + (inn ? "ok" : "") + '" data-checkin="' + m.id + '">' + M.icon(inn ? "check" : "plus") + "<span>" + (inn ? "In" : "Check in") + "</span></button></div>";
    }).join("") + "</div>";
  }
  function riskHtml(risk) {
    if (!risk.length) return '<div class="note in">Everyone on the roster trained in the last 7 days. Good retention week.</div>';
    return '<div class="rows">' + risk.slice(0, 8).map(function (m) {
      var lv = G.lastVisit(m.id);
      var days = lv ? M.dayDiff(lv, new Date()) : M.dayDiff(m.joined, new Date());
      return '<div class="row"><span data-open="' + m.id + '" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:pointer">' + av(m, "sm")
        + '<span style="min-width:0"><span class="nm" style="display:block">' + M.esc(m.name) + '</span><span class="sub">' + (lv ? "last visit " + M.fmtD(lv, "dm") : "never checked in") + "</span></span></span>"
        + '<span class="bdg ' + (days >= 14 ? "no" : "wn") + '">' + days + "d</span>"
        + '<a class="icb sm" target="_blank" rel="noopener" title="WhatsApp nudge" href="' + M.wa(m.phone, nudgeText(m, days)) + '">' + M.icon("message") + "</a></div>";
    }).join("") + "</div>";
  }
  function nudgeText(m, days) {
    var p = M.store.gym.profile;
    return "Hi " + m.name.split(" ")[0] + ", " + (p.trainer || "your coach") + " here from " + (p.name || "the gym") + "."
      + " We have not seen you in " + days + " days — your " + (L.goal[m.goal] || "fitness") + " plan is still on track if you come back this week."
      + " Shall I keep a slot for you today?";
  }
  function duesHtml(dues) {
    if (!dues.length) return '<div class="note in">No pending fees. Every active membership is paid up.</div>';
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Member</th><th>Plan</th><th>Paid till</th><th>Status</th><th class="r">Amount</th><th></th></tr></thead><tbody>'
      + dues.map(function (x) {
        var m = x.m;
        return '<tr class="click" data-open="' + m.id + '"><td><span class="nm">' + M.esc(m.name) + '</span><div class="sub">' + M.esc(m.phone || "") + "</div></td>"
          + "<td>" + M.esc(L.plan[m.plan]) + "</td><td>" + M.fmtD(G.paidUntil(m), "dm") + "</td>"
          + '<td><span class="bdg ' + x.st.cls + '">' + M.esc(x.st.label) + "</span></td>"
          + '<td class="r">' + M.money(m.fee) + "</td>"
          + '<td class="r" style="white-space:nowrap"><button class="icb sm" data-pay="' + m.id + '" title="Record payment">' + M.icon("wallet") + "</button> "
          + '<a class="icb sm" target="_blank" rel="noopener" title="WhatsApp reminder" href="' + M.wa(m.phone, feeText(m, x.st)) + '">' + M.icon("message") + "</a></td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function feeText(m, st) {
    var p = M.store.gym.profile;
    return "Hi " + m.name.split(" ")[0] + ", this is a reminder from " + (p.name || "the gym") + ". Your "
      + (L.plan[m.plan] || "").toLowerCase() + " membership " + (st.k === "overdue" ? "expired " + st.days + " days ago" : "is due in " + st.days + " days")
      + " — amount " + M.money(m.fee) + ". You can pay at the desk or by UPI. Thank you!";
  }

  /* ============================================================
     MEMBER ROSTER
     ============================================================ */
  VIEWS.members = function (host) {
    var all = G.all();
    var list = all.filter(function (m) {
      if (mFilter.status && m.status !== mFilter.status) return false;
      if (mFilter.goal && m.goal !== mFilter.goal) return false;
      if (mFilter.level && m.level !== mFilter.level) return false;
      if (mFilter.q) {
        var q = mFilter.q.toLowerCase();
        if ((m.name + " " + m.phone + " " + (L.goal[m.goal] || "")).toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (mFilter.sort === "name") return a.name.localeCompare(b.name);
      if (mFilter.sort === "joined") return a.joined < b.joined ? 1 : -1;
      if (mFilter.sort === "attendance") return G.attPct(b.id) - G.attPct(a.id);
      if (mFilter.sort === "dues") return G.dueDays(a) - G.dueDays(b);
      return 0;
    });

    host.innerHTML =
      '<div class="glass card" style="padding:14px 16px">'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
      + '<div class="search" style="min-width:210px"><span>' + M.icon("search") + '</span><input id="mq" placeholder="Search name or phone…" value="' + M.esc(mFilter.q) + '"></div>'
      + '<select class="sel" id="fStatus" style="width:auto">' + opts([["active", "Active"], ["paused", "On hold"], ["left", "Left"], ["", "All statuses"]], mFilter.status) + "</select>"
      + '<select class="sel" id="fGoal" style="width:auto">' + opts([["", "All goals"]].concat(M.f.dictOpts(L.goal)), mFilter.goal) + "</select>"
      + '<select class="sel" id="fLevel" style="width:auto">' + opts([["", "All levels"]].concat(M.f.dictOpts(L.level)), mFilter.level) + "</select>"
      + '<select class="sel" id="fSort" style="width:auto">' + opts([["name", "Sort: name"], ["joined", "Sort: newest"], ["attendance", "Sort: attendance"], ["dues", "Sort: fee due"]], mFilter.sort) + "</select>"
      + '<div class="seg" style="margin-left:auto"><button id="vCards" class="' + (mFilter.view === "cards" ? "on" : "") + '">' + M.icon("grid") + "Cards</button>"
      + '<button id="vTable" class="' + (mFilter.view === "table" ? "on" : "") + '">' + M.icon("list") + "Table</button></div>"
      + '<span class="bdg ac">' + list.length + " shown</span>"
      + "</div></div>"
      + '<div id="mList"></div>';

    var box = M.$("#mList", host);
    if (!list.length) {
      box.innerHTML = '<div class="glass card">' + M.emptyState("users", "No members match", "Try clearing the filters, or add a new member.",
        '<button class="btn primary" style="margin-top:10px" data-act="addmember">' + M.icon("plus") + "<span>Add member</span></button>") + "</div>";
    } else if (mFilter.view === "cards") {
      box.innerHTML = '<div class="mcards">' + list.map(memberCard).join("") + "</div>";
    } else {
      box.innerHTML = '<div class="glass card" style="padding:0;overflow:hidden">' + memberTable(list) + "</div>";
    }

    M.$("#mq", host).oninput = function (e) { mFilter.q = e.target.value; VIEWS.members(host); };
    M.$("#fStatus", host).onchange = function (e) { mFilter.status = e.target.value; VIEWS.members(host); };
    M.$("#fGoal", host).onchange = function (e) { mFilter.goal = e.target.value; VIEWS.members(host); };
    M.$("#fLevel", host).onchange = function (e) { mFilter.level = e.target.value; VIEWS.members(host); };
    M.$("#fSort", host).onchange = function (e) { mFilter.sort = e.target.value; VIEWS.members(host); };
    M.$("#vCards", host).onclick = function () { mFilter.view = "cards"; VIEWS.members(host); };
    M.$("#vTable", host).onclick = function () { mFilter.view = "table"; VIEWS.members(host); };
  };
  function opts(arr, v) {
    return arr.map(function (o) {
      return '<option value="' + M.esc(o[0]) + '"' + (String(o[0]) === String(v) ? " selected" : "") + ">" + M.esc(o[1]) + "</option>";
    }).join("");
  }
  function memberCard(m) {
    var st = G.feeState(m), att = G.attPct(m.id), wt = G.weight(m), dl = G.weightDelta(m);
    var goalGood = m.goal === "fatloss" ? dl < 0 : m.goal === "muscle" ? dl > 0 : Math.abs(dl) < 1.5;
    var lv = G.lastVisit(m.id);
    return '<div class="glass mcard" data-open="' + m.id + '">'
      + '<div class="mh">' + av(m, "lg") + '<div class="meta"><div class="nm">' + M.esc(m.name) + "</div>"
      + '<div class="sub"><span>' + M.esc(L.goal[m.goal]) + "</span><span>·</span><span>" + M.esc(L.level[m.level]) + "</span></div></div></div>"
      + '<div class="tags"><span class="bdg ' + st.cls + ' dot">' + M.esc(st.label) + "</span>"
      + '<span class="bdg">' + M.esc(L.diet[m.diet]) + "</span>"
      + '<span class="bdg">' + (m.daysPerWeek || 4) + "×/wk</span>"
      + (lv ? '<span class="bdg' + (M.dayDiff(lv, new Date()) >= 7 ? " wn" : "") + '">' + M.icon("clock") + M.esc(M.ago(lv)) + "</span>" : '<span class="bdg wn">never in</span>')
      + "</div>"
      + '<div class="mstats">'
      + "<div><b>" + M.n1(wt) + '</b><span>kg</span></div>'
      + "<div><b class=\"" + (goalGood ? "up" : dl === 0 ? "" : "down") + '">' + M.signed(dl) + '</b><span>change</span></div>'
      + "<div><b>" + att + '%</b><span>attend</span></div>'
      + "</div>"
      + '<div class="mfoot"><button class="btn sm ' + (G.isIn(m.id, M.today()) ? "ok" : "") + '" data-checkin="' + m.id + '">'
      + M.icon(G.isIn(m.id, M.today()) ? "check" : "plus") + "<span>" + (G.isIn(m.id, M.today()) ? "Checked in" : "Check in") + "</span></button>"
      + '<button class="btn sm" data-log="' + m.id + '">' + M.icon("dumbbell") + "<span>Log</span></button>"
      + '<button class="icb sm" data-edit="' + m.id + '" title="Edit">' + M.icon("edit") + "</button>"
      + (m.phone ? '<a class="icb sm" target="_blank" rel="noopener" href="' + M.wa(m.phone, "Hi " + m.name.split(" ")[0] + ", ") + '" title="WhatsApp">' + M.icon("message") + "</a>" : "")
      + "</div></div>";
  }
  function memberTable(list) {
    return '<div class="tbl-wrap" style="border:none;border-radius:0"><table class="tbl"><thead><tr>'
      + "<th>Member</th><th>Goal</th><th>Level</th><th class=\"r\">Weight</th><th class=\"r\">Change</th><th class=\"r\">Attend</th><th>Last visit</th><th>Fees</th><th></th>"
      + "</tr></thead><tbody>"
      + list.map(function (m) {
        var st = G.feeState(m), dl = G.weightDelta(m);
        return '<tr class="click" data-open="' + m.id + '">'
          + '<td><div style="display:flex;align-items:center;gap:9px">' + av(m, "sm") + '<div><span class="nm">' + M.esc(m.name) + '</span><div class="sub">' + M.esc(m.phone || "—") + "</div></div></div></td>"
          + "<td>" + M.esc(L.goal[m.goal]) + "</td><td>" + M.esc(L.level[m.level]) + "</td>"
          + '<td class="r">' + M.n1(G.weight(m)) + " kg</td>"
          + '<td class="r ' + (dl < 0 ? "down" : dl > 0 ? "up" : "") + '">' + M.signed(dl) + "</td>"
          + '<td class="r">' + G.attPct(m.id) + "%</td>"
          + "<td>" + M.esc(M.ago(G.lastVisit(m.id))) + "</td>"
          + '<td><span class="bdg ' + st.cls + '">' + M.esc(st.label) + "</span></td>"
          + '<td class="r" style="white-space:nowrap"><button class="icb sm" data-checkin="' + m.id + '" title="Check in">' + M.icon("checkCircle") + "</button> "
          + '<button class="icb sm" data-log="' + m.id + '" title="Log workout">' + M.icon("dumbbell") + "</button></td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  /* ============================================================
     MEMBER PROFILE
     ============================================================ */
  VIEWS.member = function (host, id) {
    var m = G.byId(id);
    if (!m) { host.innerHTML = '<div class="glass card">' + M.emptyState("user", "Member not found", "They may have been deleted.") + "</div>"; return; }
    var tk = M.today(), now = new Date();
    var mets = G.metrics(id), last = G.latest(id);
    var wt = G.weight(m), dl = G.weightDelta(m), bmi = G.bmi(m), bf = G.bodyFat(m), lean = G.lean(m);
    var rate = G.weeklyRate(id, 4);
    var st = G.feeState(m);
    var ss = G.sessions(id);
    var wkFrom = M.keyOf(M.addDays(now, -6)), lwFrom = M.keyOf(M.addDays(now, -13)), lwTo = M.keyOf(M.addDays(now, -7));
    var thisWk = G.muscleLoad(id, wkFrom, tk), lastWk = G.muscleLoad(id, lwFrom, lwTo);
    var volThis = M.sum(G.sessionsIn(id, wkFrom, tk), function (s) { return G.sessionVolume(s); });
    var volLast = M.sum(G.sessionsIn(id, lwFrom, lwTo), function (s) { return G.sessionVolume(s); });
    var prs = G.prs(id);
    var T = M.NUT.targets(m);

    /* weight series (last 16 entries) */
    var wser = mets.filter(function (r) { return r.w; }).slice(-16);
    var wvals = wser.map(function (r) { return r.w; });

    host.innerHTML =
      '<div class="glass phead">'
      + av(m, "xl")
      + '<div class="pmeta"><h1>' + M.esc(m.name) + "</h1>"
      + '<div class="pline"><span>' + M.icon("target", "") + "</span>" + M.esc(L.goal[m.goal])
      + "<span>·</span>" + M.esc(L.level[m.level])
      + "<span>·</span>" + M.esc(L.diet[m.diet])
      + "<span>·</span>joined " + M.fmtD(m.joined) + " (" + M.dayDiff(m.joined, now) + " days)"
      + (m.phone ? "<span>·</span>" + M.esc(m.phone) : "")
      + (M.age(m.dob) ? "<span>·</span>" + M.age(m.dob) + " yrs" : "")
      + "</div>"
      + '<div class="ptags">'
      + '<span class="bdg ' + st.cls + ' dot">' + M.esc(st.label) + "</span>"
      + '<span class="bdg">' + M.esc(L.plan[m.plan]) + " · " + M.money(m.fee) + "</span>"
      + '<span class="bdg">' + (m.daysPerWeek || 4) + " days/week</span>"
      + '<span class="bdg' + (m.status === "active" ? " ok" : " wn") + '">' + M.esc(L.status[m.status]) + "</span>"
      + (m.medical ? '<span class="bdg no">' + M.icon("alert") + "Medical note</span>" : "")
      + "</div></div>"
      + '<div class="pacts no-print">'
      + '<button class="btn ' + (G.isIn(id, tk) ? "ok" : "primary") + '" data-checkin="' + id + '">' + M.icon(G.isIn(id, tk) ? "check" : "checkCircle") + "<span>" + (G.isIn(id, tk) ? "Checked in today" : "Check in") + "</span></button>"
      + '<button class="btn" data-log="' + id + '">' + M.icon("dumbbell") + "<span>Log workout</span></button>"
      + '<button class="btn" data-metric="' + id + '">' + M.icon("scale") + "<span>Add measurement</span></button>"
      + '<button class="btn" data-diet="' + id + '">' + M.icon("utensils") + "<span>Diet plan</span></button>"
      + '<button class="icb" data-edit="' + id + '" title="Edit profile">' + M.icon("edit") + "</button>"
      + '<button class="btn" data-report="' + id + '">' + M.icon("print") + "<span>Client report</span></button>"
      + (m.phone ? '<a class="icb" target="_blank" rel="noopener" href="' + M.wa(m.phone, "Hi " + m.name.split(" ")[0] + ", ") + '" title="WhatsApp">' + M.icon("message") + "</a>" : "")
      + "</div></div>"

      + '<div class="pgrid">'

      /* --- body & progress --- */
      + card("scale", "Body & progress", mets.length + " weigh-in" + (mets.length === 1 ? "" : "s"),
        '<div class="stats" style="margin-bottom:14px">'
        + sbox(M.n1(wt) + "<small> kg</small>", "Current weight", { cls: dl === 0 ? "flat-c" : (m.goal === "fatloss" ? (dl < 0 ? "up" : "down") : (dl > 0 ? "up" : "down")), txt: M.signed(dl, " kg") + " since joining" })
        + sbox(M.n1(bmi), "BMI", { cls: bmi >= 18.5 && bmi < 25 ? "up" : "down", txt: G.bmiLabel(bmi) })
        + sbox(bf != null ? bf + "<small>%</small>" : "—", "Body fat", bf != null ? { cls: "flat-c", txt: "Navy method" } : { cls: "flat-c", txt: "add neck + waist" })
        + sbox(lean != null ? M.n1(lean) + "<small> kg</small>" : "—", "Lean mass")
        + sbox(rate != null ? M.signed(rate, " kg") : "—", "Weekly rate", rate != null ? rateFlag(rate, m, wt) : null)
        + sbox(m.targetWeight ? M.n1(m.targetWeight) + "<small> kg</small>" : "—", "Target", m.targetWeight ? { cls: "flat-c", txt: M.n1(Math.abs(m.targetWeight - wt)) + " kg to go" } : null)
        + "</div>"
        + (wvals.length > 1
          ? '<div class="legend"><span><i style="background:#0f766e"></i>Weight (kg)</span>' + (m.targetWeight ? '<span><i style="background:var(--muted-2)"></i>Target</span>' : "") + "</span></div>"
          + M.areaChart(wvals, { color: "#0f766e", goal: m.targetWeight || null, dots: true })
          + '<div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--muted-2);margin-top:6px"><span>' + M.fmtD(wser[0].d, "dm") + "</span><span>" + M.fmtD(wser[wser.length - 1].d, "dm") + "</span></div>"
          : M.chartEmpty("Add two weigh-ins to see the trend."))
        + projHtml(m)
        , "span2",
        '<button class="btn sm no-print" data-metric="' + id + '">' + M.icon("plus") + "<span>Weigh-in</span></button>")

      /* --- attendance --- */
      + card("calendar", "Attendance", "target " + (m.daysPerWeek || 4) + " sessions a week",
        '<div class="stats" style="margin-bottom:12px">'
        + sbox(G.attPct(id) + "<small>%</small>", "Last 4 weeks")
        + sbox(String(G.visits(id).length), "Total visits")
        + sbox(String(G.visitStreak(id)), "Visit streak")
        + sbox("<span style=\"font-size:var(--fs-13)\">" + M.esc(M.ago(G.lastVisit(id)).replace(/^./, function (x) { return x.toUpperCase(); })) + "</span>", "Last seen")
        + "</div>"
        + attWeeks(id, m)
      )

      /* --- this week's training --- */
      + card("dumbbell", "This week’s training", "last 7 days · sets per muscle",
        '<div class="stats" style="margin-bottom:12px">'
        + sbox(String(G.sessionsIn(id, wkFrom, tk).length), "Sessions")
        + sbox(Math.round(volThis / 1000) + "<small> t</small>", "Volume", volLast ? { cls: volThis >= volLast ? "up" : "down", txt: M.signed(M.pct(volThis - volLast, volLast || 1), "%") + " vs last week" } : null)
        + sbox(String(M.sum(G.sessionsIn(id, wkFrom, tk), function (s) { return G.sessionSets(s); })), "Total sets")
        + "</div>"
        + muscleHtml(thisWk, lastWk)
        + neglected(thisWk, m)
      )

      /* --- last session --- */
      + card("clipboard", "Last session", ss.length ? M.fmtD(ss[0].d, "long") + " · " + (L.split[ss[0].split] || ss[0].split) : "nothing logged yet",
        ss.length ? sessionHtml(ss[0], id) : M.emptyState("dumbbell", "No workouts logged", "Log the first session to start tracking volume, PRs and muscle balance.",
          '<button class="btn primary" style="margin-top:10px" data-log="' + id + '">' + M.icon("plus") + "<span>Log workout</span></button>"),
        "span2",
        ss.length ? '<button class="btn sm no-print" data-log="' + id + '">' + M.icon("plus") + "<span>New session</span></button>" : "")

      /* --- PRs --- */
      + card("award", "Personal records", "best estimated 1RM per lift",
        prs.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Exercise</th><th class="r">Best set</th><th class="r">e1RM</th><th>When</th></tr></thead><tbody>'
          + prs.slice(0, 10).map(function (p) {
            return "<tr><td><span class=\"nm\">" + M.esc(p.name) + '</span><div class="sub">' + M.esc(M.EXDB.label(M.EXDB.muscleOf(p.name))) + "</div></td>"
              + '<td class="r">' + M.n1(p.wt) + " kg × " + p.reps + '</td><td class="r"><b>' + M.n1(p.e1) + " kg</b></td><td>" + M.fmtD(p.d, "dm") + "</td></tr>";
          }).join("") + "</tbody></table></div>"
          : M.chartEmpty("PRs appear once weights are logged.")
      )

      /* --- volume trend --- */
      + card("trend", "Volume trend", "weekly tonnage · last 10 weeks", volTrend(id), "span2")

      /* --- per-exercise progress --- */
      + '<div class="glass card span2" id="exProgCard"></div>'

      /* --- programme --- */
      + card("layers", "Training programme", m.program ? m.program.name : "not assigned yet",
        m.program ? progHtml(m.program) : M.emptyState("layers", "No programme yet",
          "Generate a split from their days per week, level and goal — you can edit it after.",
          '<button class="btn primary" style="margin-top:10px" data-prog="' + id + '">' + M.icon("zap") + "<span>Generate programme</span></button>"),
        "span2",
        m.program ? '<button class="btn sm no-print" data-prog="' + id + '">' + M.icon("refresh") + "<span>Regenerate</span></button>"
          + ' <button class="btn sm no-print" data-progtext="' + id + '">' + M.icon("message") + "<span>Send</span></button>" : "")

      /* --- diet --- */
      + card("utensils", "Nutrition targets", "Mifflin-St Jeor · " + L.activity[m.activity],
        '<div class="macros" style="margin-bottom:12px">'
        + '<div class="macro"><b>' + T.kcal + "</b><span>kcal/day</span><small>TDEE " + T.tdee + "</small></div>"
        + '<div class="macro"><b>' + T.protein + "</b><span>protein g</span><small>" + T.perKg + " g/kg</small></div>"
        + '<div class="macro"><b>' + T.carbs + "</b><span>carbs g</span><small>" + Math.round((T.carbs * 4 / T.kcal) * 100) + "%</small></div>"
        + '<div class="macro"><b>' + T.fat + "</b><span>fat g</span><small>" + Math.round((T.fat * 9 / T.kcal) * 100) + "%</small></div>"
        + "</div>"
        + '<div class="note">' + (T.deficit > 0 ? "Deficit of <b>" + T.deficit + " kcal</b>/day" : T.deficit < 0 ? "Surplus of <b>" + (-T.deficit) + " kcal</b>/day" : "Maintenance calories")
        + " · water <b>" + (T.water / 1000).toFixed(1) + " L</b> · fibre <b>" + T.fibre + " g</b>"
        + (m.dietPlan ? " · plan saved " + M.fmtD(m.dietPlan.created, "dm") : " · no meal plan generated yet") + "</div>",
        "span2",
        '<button class="btn sm primary no-print" data-diet="' + id + '">' + M.icon("utensils") + "<span>" + (m.dietPlan ? "Open plan" : "Generate plan") + "</span></button>")

      /* --- measurements --- */
      + card("ruler", "Measurements", last ? "latest " + M.fmtD(last.d, "dm") : "none recorded", measureHtml(mets), "span2")

      /* --- fees --- */
      + card("wallet", "Fees & payments", "paid till " + M.fmtD(G.paidUntil(m), "long"),
        '<div class="stats" style="margin-bottom:12px">'
        + sbox(M.money(m.fee), L.plan[m.plan])
        + sbox(M.money(M.sum(G.payments(id), function (p) { return +p.amt || 0; })), "Lifetime value")
        + sbox(String(G.payments(id).length), "Payments")
        + "</div>"
        + (G.payments(id).length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Months</th><th>Mode</th><th class="r">Amount</th><th></th></tr></thead><tbody>'
          + G.payments(id).slice(0, 8).map(function (p) {
            return "<tr><td>" + M.fmtD(p.d) + "</td><td>" + p.months + "</td><td>" + M.esc(L.mode[p.mode] || p.mode || "") + '</td><td class="r">' + M.money(p.amt) + "</td>"
              + '<td class="r" style="white-space:nowrap"><button class="icb sm no-print" data-rcpt="' + p.id + '" title="Receipt">' + M.icon("print") + "</button> "
              + '<button class="icb sm no-print" data-delpay="' + p.id + '" title="Delete">' + M.icon("trash") + "</button></td></tr>";
          }).join("") + "</tbody></table></div>" : '<div class="note">No payments recorded yet.</div>'),
        "span2",
        '<button class="btn sm no-print" data-pay="' + id + '">' + M.icon("plus") + "<span>Record payment</span></button>"
        + (m.phone ? ' <a class="btn sm no-print" target="_blank" rel="noopener" href="' + M.wa(m.phone, feeText(m, st)) + '">' + M.icon("message") + "<span>Remind</span></a>" : ""))

      /* --- dated notes timeline --- */
      + '<div class="glass card" id="notesCard"></div>'

      /* --- notes --- */
      + card("clipboard", "Profile notes", "carried on the client report",
        '<div class="note"' + (m.medical ? ' class="note no"' : "") + ">" + (m.medical ? "<b>Medical:</b> " + M.esc(m.medical) + "<br>" : "")
        + (m.notes ? M.esc(m.notes) : "<span style=\"color:var(--muted-2)\">No notes yet — use Edit profile to add training history, injuries or preferences.</span>") + "</div>")

      + "</div>";

    drawExProg(host, id, null);
    drawNotes(host, id);
  };

  /* ---------------- goal projection ---------------- */
  function projHtml(m) {
    var p = G.projection(m);
    if (!p) return "";
    if (p.done) return '<div class="note in" style="margin-top:12px">' + M.icon("target") + " Target of <b>" + M.n1(p.target) + " kg</b> reached. Set a new target, or switch the goal to maintenance.</div>";
    if (p.wrongWay) return '<div class="note no" style="margin-top:12px">' + M.icon("alert") + " Moving away from the target: " + M.signed(p.rate, " kg") + "/week while <b>" + M.n1(Math.abs(p.need)) + " kg</b> is still needed the other way. Review intake and attendance before changing the programme.</div>";
    if (p.stalled) return '<div class="note wn" style="margin-top:12px">' + M.icon("alert") + " Weight has been flat for the last few weeks with <b>" + M.n1(Math.abs(p.need)) + " kg</b> to go. Adjust calories by ~10% or add a session.</div>";
    if (p.slow) return '<div class="note wn" style="margin-top:12px">' + M.icon("clock") + " At " + M.signed(p.rate, " kg") + "/week this target is more than two years away. Consider a nearer milestone.</div>";
    return '<div class="note in" style="margin-top:12px">' + M.icon("trend") + " At <b>" + M.signed(p.rate, " kg") + "/week</b>, "
      + M.esc(m.name.split(" ")[0]) + " reaches <b>" + M.n1(p.target) + " kg</b> in about <b>" + p.weeks
      + " weeks</b> — around <b>" + M.fmtD(p.eta, "long") + "</b>.</div>";
  }

  /* ---------------- per-exercise progress ---------------- */
  function drawExProg(host, id, name) {
    var box = M.$("#exProgCard", host);
    if (!box) return;
    var used = G.exercisesUsed(id);
    if (!used.length) {
      box.innerHTML = '<div class="card-h"><div class="ic">' + M.icon("trend") + '</div><div><h3>Exercise progress</h3><span class="sub">load and estimated 1RM over time</span></div></div>'
        + M.chartEmpty("Log a few sessions and each lift gets its own progress chart.");
      return;
    }
    /* default to the exercise with the most history */
    if (!name || used.indexOf(name) < 0) {
      name = used.slice().sort(function (a, b) { return G.exHistory(id, b).length - G.exHistory(id, a).length; })[0];
    }
    var h = G.exHistory(id, name);
    var first = h[0], last = h[h.length - 1];
    var gain = first && last ? last.e1 - first.e1 : 0;
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("trend") + '</div><div><h3>Exercise progress</h3>'
      + '<span class="sub">' + h.length + " session" + (h.length === 1 ? "" : "s") + " logged · top set and estimated 1RM</span></div>"
      + '<div class="acts"><select class="sel" id="exSel" style="width:auto;max-width:230px">'
      + used.map(function (n) { return '<option value="' + M.esc(n) + '"' + (n === name ? " selected" : "") + ">" + M.esc(n) + "</option>"; }).join("")
      + "</select></div></div>"
      + '<div class="stats" style="margin-bottom:12px">'
      + sbox(last ? M.n1(last.w) + "<small> kg</small>" : "—", "Latest top set", last ? { cls: "flat-c", txt: last.r + " reps · " + M.fmtD(last.d, "dm") } : null)
      + sbox(last ? M.n1(last.e1) + "<small> kg</small>" : "—", "Estimated 1RM", first && h.length > 1 ? { cls: gain >= 0 ? "up" : "down", txt: M.signed(gain, " kg") + " since " + M.fmtD(first.d, "dm") } : null)
      + sbox(String(M.sum(h, function (x) { return x.sets; })), "Total sets")
      + sbox(Math.round(M.sum(h, function (x) { return x.vol; }) / 1000) + "<small> t</small>", "Total volume")
      + "</div>"
      + (h.length > 1
        ? '<div class="legend"><span><i style="background:#5b5f8f"></i>Estimated 1RM (kg)</span><span><i style="background:#0f766e"></i>Top set load (kg)</span></div>'
        + M.multiLine([
          { vals: h.map(function (x) { return x.e1; }), color: "#5b5f8f" },
          { vals: h.map(function (x) { return x.w; }), color: "#0f766e" }
        ], { len: h.length, min: 0 })
        + '<div class="rep-axis" style="margin-top:6px"><span>' + M.fmtD(h[0].d, "dm") + "</span><span>" + M.fmtD(h[h.length - 1].d, "dm") + "</span></div>"
        : '<div class="note">One session logged so far — the trend line appears from the second one.</div>');
    var sel = M.$("#exSel", box);
    if (sel) sel.onchange = function (e) { drawExProg(host, id, e.target.value); };
  }

  /* ---------------- notes timeline ---------------- */
  function drawNotes(host, id) {
    var box = M.$("#notesCard", host);
    if (!box) return;
    var notes = G.notes(id);
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("clipboard") + '</div><div><h3>Session notes</h3>'
      + '<span class="sub">' + (notes.length ? notes.length + " entries · newest first" : "dated notes for this member") + "</span></div></div>"
      + '<div class="fld no-print" style="margin-bottom:12px"><div style="display:flex;gap:8px">'
      + '<input class="inp" id="noteIn" placeholder="e.g. shoulder felt tight on presses — dropped to 3 sets">'
      + '<button class="btn primary" id="noteAdd" style="flex:none">' + M.icon("plus") + "<span>Add</span></button></div></div>"
      + (notes.length
        ? '<div class="tl">' + notes.map(function (n) {
          return '<div class="tli"><span class="dot"></span><div class="body"><div class="d">' + M.fmtD(n.d, "long") + "</div>"
            + '<div class="t">' + M.esc(n.t) + "</div></div>"
            + '<button class="icb sm bare x no-print" data-delnote="' + n.id + '" title="Delete note">' + M.icon("trash") + "</button></div>";
        }).join("") + "</div>"
        : '<div class="note">Nothing logged yet. Notes here are dated, appear on the client report and are the fastest way to remember what happened last week.</div>');
    var inp = M.$("#noteIn", box), add = M.$("#noteAdd", box);
    function save() {
      var v = inp.value.trim();
      if (!v) { M.toast("Type the note first", "no"); return; }
      G.addNote(id, v);
      inp.value = "";
      drawNotes(host, id);
      M.toast("Note added", "ok");
    }
    add.onclick = save;
    inp.onkeydown = function (e) { if (e.key === "Enter") save(); };
    box.onclick = function (e) {
      var t = e.target.closest("[data-delnote]");
      if (!t) return;
      G.delNote(id, t.dataset.delnote);
      drawNotes(host, id);
    };
  }

  function rateFlag(rate, m, wt) {
    var pctW = (Math.abs(rate) / wt) * 100;
    if (m.goal === "fatloss") {
      if (rate > 0) return { cls: "down", txt: "gaining — check intake" };
      if (pctW > 1) return { cls: "down", txt: "too fast — raise calories" };
      return { cls: "up", txt: "on track" };
    }
    if (m.goal === "muscle") {
      if (rate < 0) return { cls: "down", txt: "losing — raise calories" };
      if (pctW > .6) return { cls: "down", txt: "too fast — trim surplus" };
      return { cls: "up", txt: "on track" };
    }
    return { cls: "flat-c", txt: "4-week average" };
  }
  function attWeeks(id, m) {
    var now = new Date(), out = [], i;
    for (i = 7; i >= 0; i--) {
      var ws = M.weekStart(M.addDays(now, -i * 7));
      var from = M.keyOf(ws), to = M.keyOf(M.addDays(ws, 6));
      var n = G.visitsIn(id, from, to).length;
      out.push({ label: i === 0 ? "now" : "-" + i, value: n, hi: i === 0, color: n >= (m.daysPerWeek || 4) ? "var(--ok)" : n > 0 ? "var(--warn)" : "var(--track)" });
    }
    return M.columns(out, { max: Math.max(m.daysPerWeek || 4, Math.max.apply(null, out.map(function (o) { return o.value; }))), style: "height:130px" });
  }
  function muscleHtml(cur, prev) {
    var keys = M.EXDB.ORDER.filter(function (k) { return cur[k] || prev[k]; });
    if (!keys.length) return M.chartEmpty("No sets logged in the last 7 days.");
    var max = Math.max.apply(null, keys.map(function (k) { return (cur[k] || { sets: 0 }).sets; }).concat([1]));
    return '<div class="muscle-bars">' + keys.map(function (k) {
      var c = (cur[k] || { sets: 0 }).sets, p = (prev[k] || { sets: 0 }).sets;
      var d = c - p;
      return '<div class="mb"><span class="mn">' + M.esc(M.EXDB.label(k)) + "</span>"
        + '<span class="mt"><i style="width:' + (c / max) * 100 + "%;background:" + M.EXDB.color(k) + '"></i></span>'
        + '<span class="mv">' + M.n1(c) + " sets " + (p ? '<span class="' + (d >= 0 ? "up" : "down") + '">' + M.signed(d, "", 0) + "</span>" : "") + "</span></div>";
    }).join("") + "</div>";
  }
  function neglected(cur, m) {
    var big = ["chest", "back", "lats", "shoulders", "quads", "hamstrings", "glutes"];
    var miss = big.filter(function (k) { return !cur[k] || cur[k].sets < 2; });
    if (!miss.length) return "";
    return '<div class="note wn" style="margin-top:12px"><b>Not trained this week:</b> '
      + miss.map(function (k) { return M.EXDB.label(k); }).join(", ")
      + ". Add one movement per gap in the next session to keep the split balanced.</div>";
  }
  function sessionHtml(s, mid) {
    var m = G.byId(mid);
    return '<div class="sesscard"><div class="sh">'
      + '<b>' + M.esc(L.split[s.split] || s.split) + "</b>"
      + '<span class="bdg">' + M.icon("clock") + (s.dur || "—") + " min</span>"
      + '<span class="bdg">' + G.sessionSets(s) + " sets</span>"
      + '<span class="bdg in">' + Math.round(G.sessionVolume(s)).toLocaleString("en-IN") + " kg volume</span>"
      + (s.rpe ? '<span class="bdg wn">RPE ' + s.rpe + "</span>" : "")
      + '<span style="margin-left:auto;display:flex;gap:6px" class="no-print"><button class="icb sm" data-editsess="' + s.id + '" title="Edit">' + M.icon("edit") + "</button>"
      + '<button class="icb sm" data-delsess="' + s.id + '" title="Delete">' + M.icon("trash") + "</button></span>"
      + "</div>"
      + '<div class="exlist">' + (s.ex || []).map(function (e) {
        var best = (e.sets || []).slice().sort(function (a, b) { return G.e1rm(b.w, b.r) - G.e1rm(a.w, a.r); })[0];
        var sug = G.suggest(mid, e.name, m.goal);
        return '<div class="exrow"><div class="eh"><span class="nm">' + M.esc(e.name) + "</span>"
          + '<span class="bdg">' + M.esc(M.EXDB.label(M.EXDB.muscleOf(e.name))) + "</span>"
          + (sug ? '<span class="bdg ac" title="Progressive overload suggestion">next: ' + M.n1(sug.w) + " kg × " + sug.r + "</span>" : "")
          + "</div>"
          + '<div class="sets">' + (e.sets || []).map(function (st) {
            var isBest = best && st === best;
            return '<i class="' + (isBest ? "best" : "") + '">' + M.n1(st.w) + " × " + st.r + "</i>";
          }).join("") + "</div></div>";
      }).join("") + "</div>"
      + (s.notes ? '<div class="note">' + M.esc(s.notes) + "</div>" : "")
      + "</div>";
  }
  function volTrend(id) {
    var now = new Date(), vals = [], i;
    for (i = 9; i >= 0; i--) {
      var ws = M.weekStart(M.addDays(now, -i * 7));
      vals.push(Math.round(M.sum(G.sessionsIn(id, M.keyOf(ws), M.keyOf(M.addDays(ws, 6))), function (s) { return G.sessionVolume(s); }) / 100) / 10);
    }
    if (!M.sum(vals)) return M.chartEmpty("Log workouts with weights to see tonnage over time.");
    return '<div class="legend"><span><i style="background:#b45309"></i>Tonnes lifted per week</span></div>'
      + M.areaChart(vals, { color: "#b45309", min: 0, dots: true }) + weekAxis(10);
  }
  function progHtml(pg) {
    return '<div class="prog">' + pg.days.map(function (d) {
      return '<div class="pday"><div class="ph"><b>' + M.esc(d.name) + '</b><span class="dn">' + M.esc(d.day) + "</span></div>"
        + "<ol>" + d.ex.map(function (e) {
          return "<li>" + M.esc(e.name) + " <span>" + e.sets + " × " + M.esc(e.reps) + "</span></li>";
        }).join("") + "</ol></div>";
    }).join("") + "</div>"
      + '<div class="note" style="margin-top:12px"><b>Cardio:</b> ' + M.esc(pg.cardio) + "</div>"
      + (pg.notes || []).slice(0, 3).map(function (n) { return '<div class="note" style="margin-top:8px">' + M.esc(n) + "</div>"; }).join("");
  }
  function measureHtml(mets) {
    var rows = mets.filter(function (r) { return r.waist || r.chest || r.arm || r.thigh || r.neck || r.hip; }).slice(-8).reverse();
    if (!rows.length) return M.chartEmpty("Add neck, waist, chest and arm to unlock body-fat estimates.");
    var cols = [["w", "Weight"], ["neck", "Neck"], ["chest", "Chest"], ["waist", "Waist"], ["hip", "Hip"], ["arm", "Arm"], ["thigh", "Thigh"], ["calf", "Calf"]];
    var first = rows[rows.length - 1];
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th>'
      + cols.map(function (c) { return '<th class="r">' + c[1] + "</th>"; }).join("") + "<th></th></tr></thead><tbody>"
      + rows.map(function (r, i) {
        return "<tr><td>" + M.fmtD(r.d) + "</td>"
          + cols.map(function (c) {
            var v = r[c[0]];
            var d = i === rows.length - 1 || v == null || first[c[0]] == null ? null : v - first[c[0]];
            return '<td class="r">' + (v == null ? "—" : M.n1(v) + (d ? ' <span class="' + (d < 0 ? "down" : "up") + '" style="font-size:9.5px">' + M.signed(d) + "</span>" : "")) + "</td>";
          }).join("")
          + '<td class="r"><button class="icb sm no-print" data-delmet="' + r.d + '" title="Delete">' + M.icon("trash") + "</button></td></tr>";
      }).join("") + "</tbody></table></div>"
      + '<div class="hint" style="margin-top:8px">All measurements in cm, weight in kg. Deltas compare to the oldest row shown.</div>';
  }

  /* ============================================================
     MEMBER FORM (add / edit)
     ============================================================ */
  M.memberModal = function (id) {
    var m = id ? G.byId(id) : null;
    var isNew = !m;
    m = m || M.normMember({ joined: M.today() });
    var body =
      '<div class="grid2">' + M.f.text("name", "Full name", m.name === "Member" ? "" : m.name, { req: true, ph: "e.g. Rohit Verma" })
      + M.f.text("phone", "Phone (WhatsApp)", m.phone, { ph: "10-digit mobile", type: "tel" }) + "</div>"
      + '<div class="grid3">' + M.f.sel("sex", "Sex", m.sex, [["m", "Male"], ["f", "Female"]])
      + M.f.date("dob", "Date of birth", m.dob)
      + M.f.date("joined", "Joining date", m.joined) + "</div>"
      + '<div class="divider"></div>'
      + '<div class="grid3">' + M.f.sel("goal", "Primary goal", m.goal, M.f.dictOpts(L.goal))
      + M.f.sel("level", "Experience", m.level, M.f.dictOpts(L.level))
      + M.f.sel("activity", "Daily activity", m.activity, M.f.dictOpts(L.activity)) + "</div>"
      + '<div class="grid4">' + M.f.num("height", "Height (cm)", m.height, { min: 120, max: 220 })
      + M.f.num("startWeight", "Start weight (kg)", m.startWeight, { step: "0.1", min: 30, max: 250 })
      + M.f.num("targetWeight", "Target weight (kg)", m.targetWeight || "", { step: "0.1", ph: "optional" })
      + M.f.num("daysPerWeek", "Training days / week", m.daysPerWeek, { min: 2, max: 6 }) + "</div>"
      + '<div class="divider"></div>'
      + '<div class="grid3">' + M.f.sel("diet", "Diet preference", m.diet, M.f.dictOpts(L.diet))
      + M.f.num("meals", "Meals per day", m.meals, { min: 3, max: 6 })
      + M.f.sel("batch", "Batch / slot", m.batch || "flex", M.f.dictOpts(L.batch)) + "</div>"
      + '<div class="grid3">' + M.f.sel("status", "Membership status", m.status, M.f.dictOpts(L.status)) + "</div>"
      + M.f.checks("allergies", "Avoid / allergies", m.allergies, M.FOODS.ALLERGENS)
      + '<div class="divider"></div>'
      + '<div class="grid3">' + M.f.sel("plan", "Plan", m.plan, M.f.dictOpts(L.plan))
      + M.f.num("fee", "Fee for the plan (₹)", m.fee, { min: 0, step: 50 })
      + M.f.text("trainer", "Assigned trainer", m.trainer || M.store.gym.profile.trainer, { ph: "optional" }) + "</div>"
      + M.f.area("medical", "Medical / injury notes", m.medical, { ph: "e.g. mild knee pain — avoid deep lunges" })
      + M.f.area("notes", "Trainer notes", m.notes, { ph: "training history, preferences, availability…" });

    var foot = [{
      label: isNew ? "Add member" : "Save changes", cls: "primary", icon: "check", fn: function (b) {
        var v = M.formVals(b);
        if (!v.name) { M.toast("Name is required", "no"); return; }
        if (v.phone) {
          var clash = G.all().filter(function (x) {
            return x.id !== id && x.phone && x.phone.replace(/\D/g, "") === String(v.phone).replace(/\D/g, "");
          })[0];
          if (clash) { M.toast(clash.name + " already has that number", "no"); return; }
        }
        v.height = +v.height || 170; v.startWeight = +v.startWeight || 70;
        v.meals = M.clamp(+v.meals || 4, 3, 6); v.daysPerWeek = M.clamp(+v.daysPerWeek || 4, 2, 6);
        v.fee = +v.fee || 0; v.targetWeight = +v.targetWeight || 0;
        if (isNew) {
          var nm = G.add(v);
          M.closeModal();
          M.toast("Member added", "ok");
          M.go("#/member/" + nm.id);
        } else {
          G.update(id, v);
          M.closeModal(); M.rerender(); M.toast("Profile updated", "ok");
        }
      }
    }];
    if (!isNew) {
      foot.unshift({
        label: "Archive", cls: "danger", icon: "trash", fn: function () {
          M.confirm("Archive " + m.name + "?", "They come off the roster but every workout, weigh-in and payment is kept. You can restore them from Settings → Archived members.", "Archive")
            .then(function (ok) {
              if (!ok) return;
              G.archive(id); M.closeModal(); M.go("#/members"); M.toast("Archived — restore from Settings", "ok");
            });
        }
      });
    }
    M.modal({
      title: isNew ? "New member" : "Edit " + m.name, wide: true,
      sub: "Everything here feeds the programme and diet generators — the more accurate, the better the plan.",
      body: body, footer: foot
    });
  };

  /* ---------------- measurement modal ---------------- */
  M.metricModal = function (mid) {
    var m = G.byId(mid); if (!m) return;
    var last = G.latest(mid) || {};
    var body = '<div class="grid3">' + M.f.date("d", "Date", M.today())
      + M.f.num("w", "Weight (kg)", last.w || G.weight(m), { step: "0.1", req: true })
      + M.f.num("neck", "Neck (cm)", last.neck || "", { step: "0.5" }) + "</div>"
      + '<div class="grid3">' + M.f.num("chest", "Chest (cm)", last.chest || "", { step: "0.5" })
      + M.f.num("waist", "Waist (cm)", last.waist || "", { step: "0.5", hint: "at navel" })
      + M.f.num("hip", "Hip (cm)", last.hip || "", { step: "0.5", hint: m.sex === "f" ? "needed for body fat" : "optional" }) + "</div>"
      + '<div class="grid4">' + M.f.num("arm", "Arm (cm)", last.arm || "", { step: "0.5" })
      + M.f.num("thigh", "Thigh (cm)", last.thigh || "", { step: "0.5" })
      + M.f.num("calf", "Calf (cm)", last.calf || "", { step: "0.5" })
      + M.f.num("shoulder", "Shoulder (cm)", last.shoulder || "", { step: "0.5" }) + "</div>"
      + '<div class="note">Body fat is estimated with the US Navy formula — it needs height, neck and waist' + (m.sex === "f" ? " and hip" : "") + ".</div>";
    M.modal({
      title: "Weigh-in · " + m.name, wide: true, sub: "Measure at the same time of day, ideally morning and empty stomach.",
      body: body,
      footer: [{
        label: "Save weigh-in", cls: "primary", icon: "check", fn: function (b) {
          var v = M.formVals(b);
          if (!v.d) { M.toast("Pick a date", "no"); return; }
          var rec = { d: v.d };
          ["w", "neck", "chest", "waist", "hip", "arm", "thigh", "calf", "shoulder"].forEach(function (k) { if (v[k] != null && v[k] !== "") rec[k] = +v[k]; });
          G.addMetric(mid, rec);
          M.closeModal(); M.rerender(); M.toast("Weigh-in saved", "ok");
        }
      }]
    });
  };

  /* ---------------- payment modal ---------------- */
  M.paymentModal = function (mid) {
    var m = G.byId(mid); if (!m) return;
    var months = M.PLAN_MONTHS[m.plan] || 1;
    var body = '<div class="grid2">' + M.f.date("d", "Payment date", M.today())
      + M.f.num("amt", "Amount (₹)", m.fee, { min: 0, step: 50 }) + "</div>"
      + '<div class="grid2">' + M.f.num("months", "Months covered", months, { min: 1, max: 24 })
      + M.f.sel("mode", "Mode", "upi", [["upi", "UPI"], ["cash", "Cash"], ["card", "Card"], ["bank", "Bank transfer"]]) + "</div>"
      + M.f.text("note", "Note", "", { ph: "optional — e.g. includes personal training" })
      + '<div class="note">Currently paid till <b>' + M.fmtD(G.paidUntil(m), "long") + "</b>. Adding this payment extends it by the months entered.</div>";
    M.modal({
      title: "Record payment · " + m.name, body: body,
      footer: [{
        label: "Save payment", cls: "primary", icon: "wallet", fn: function (b) {
          var v = M.formVals(b);
          var pay = G.addPayment({ mid: mid, d: v.d || M.today(), amt: +v.amt || 0, months: M.clamp(+v.months || 1, 1, 24), mode: v.mode, note: v.note });
          M.closeModal(); M.rerender();
          M.toast("Payment recorded · " + pay.rcpt, "ok", "Receipt", function () { M.receipt(pay.id); });
        }
      }]
    });
  };

  /* ---------------- printable report ---------------- */
  M.memberReport = function (mid) {
    if (G.byId(mid)) M.go("#/report/" + mid);
  };

  /* ---------------- delegated actions ---------------- */
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-checkin]"))) {
      e.stopPropagation();
      var on = G.toggleIn(t.dataset.checkin, M.today());
      M.toast(on ? "Checked in" : "Check-in removed", "ok");
      M.rerender(); return;
    }
    if ((t = e.target.closest("[data-edit]")) && G.byId(t.dataset.edit)) { e.stopPropagation(); M.memberModal(t.dataset.edit); return; }
    if ((t = e.target.closest("[data-metric]"))) { e.stopPropagation(); M.metricModal(t.dataset.metric); return; }
    if ((t = e.target.closest("[data-pay]"))) { e.stopPropagation(); M.paymentModal(t.dataset.pay); return; }
    if ((t = e.target.closest("[data-delpay]"))) {
      e.stopPropagation();
      G.delPayment(t.dataset.delpay); M.rerender(); M.toast("Payment deleted", "ok"); return;
    }
    if ((t = e.target.closest("[data-delmet]"))) {
      e.stopPropagation();
      var mid = (location.hash.match(/#\/member\/(.+)$/) || [])[1];
      if (mid) { G.delMetric(mid, t.dataset.delmet); M.rerender(); M.toast("Weigh-in deleted", "ok"); }
      return;
    }
    if ((t = e.target.closest("[data-print]"))) { e.stopPropagation(); M.memberReport(t.dataset.print); return; }
    if ((t = e.target.closest("[data-report]"))) { e.stopPropagation(); M.go("#/report/" + t.dataset.report); return; }
    if ((t = e.target.closest("[data-rcpt]"))) { e.stopPropagation(); M.receipt(t.dataset.rcpt); return; }
    if ((t = e.target.closest("[data-open]"))) { M.go("#/member/" + t.dataset.open); return; }
    if ((t = e.target.closest("[data-log]"))) { e.stopPropagation(); M.go("#/log/" + t.dataset.log); return; }
    if ((t = e.target.closest("[data-diet]"))) { e.stopPropagation(); M.go("#/diet/" + t.dataset.diet); return; }
    if ((t = e.target.closest("[data-prog]"))) {
      e.stopPropagation();
      var mm = G.byId(t.dataset.prog);
      if (mm) { G.update(mm.id, { program: M.PROG.build(mm) }); M.rerender(); M.toast("Programme generated", "ok"); }
      return;
    }
    if ((t = e.target.closest("[data-progtext]"))) {
      e.stopPropagation();
      var m2 = G.byId(t.dataset.progtext);
      if (m2 && m2.program) {
        var txt = M.PROG.text(m2.program, m2);
        if (m2.phone) window.open(M.wa(m2.phone, txt), "_blank");
        else M.copy(txt).then(function () { M.toast("Programme copied — no phone on file", "ok"); });
      }
      return;
    }
  });
})(window);
