/* ============================================================
   Momentum · app.js — shell, router, KPI strip, settings, lock
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, H = M.H, G = M.G, L = M.LBL;
  var VIEWS = (M.VIEWS = M.VIEWS || {});
  var VERSION = "6.0";

  var NAV = [
    {
      lbl: "Personal", items: [
        { r: "#/today", i: "home", t: "Today" },
        { r: "#/grid", i: "grid", t: "Habit grid" },
        { r: "#/insights", i: "chart", t: "Insights" }
      ]
    },
    {
      lbl: "Gym Studio", mod: "gym", items: [
        { r: "#/gym", i: "activity", t: "Overview" },
        { r: "#/members", i: "users", t: "Members", cnt: function () { return G.active().length; } },
        { r: "#/log", i: "dumbbell", t: "Workout log" },
        { r: "#/attendance", i: "calendar", t: "Attendance" },
        { r: "#/programs", i: "layers", t: "Programmes" },
        { r: "#/diet", i: "utensils", t: "Diet planner" },
        { r: "#/payments", i: "wallet", t: "Payments" },
        { r: "#/business", i: "trend", t: "Business report" }
      ]
    }
  ];

  /* ---------------- routing ---------------- */
  function parse() {
    var h = location.hash || M.store.settings.route || "#/today";
    var p = h.replace(/^#\/?/, "").split("/");
    return { name: p[0] || "today", arg: p[1] || null, hash: h };
  }
  M.go = function (hash) {
    if (location.hash === hash) { M.rerender(); return; }
    location.hash = hash;
  };
  M.rerender = function () { render(parse()); };

  var TITLES = {
    today: ["Today", function () { var d = new Date(); return M.DOW[d.getDay()] + ", " + d.getDate() + " " + M.MON[d.getMonth()] + " " + d.getFullYear(); }],
    grid: ["Habit grid", function () { return H.active().length + " habits tracked · click a cell to mark it"; }],
    insights: ["Insights", function () { return "trends, streaks and mental state"; }],
    gym: ["Gym overview", function () { return M.store.gym.profile.name || "attendance, retention, revenue"; }],
    members: ["Members", function () { return G.all().length + " on the roster · " + G.active().length + " active"; }],
    member: ["Member", function () { return "profile, progress and plans"; }],
    log: ["Workout log", function () { return "log sets, track volume and PRs"; }],
    attendance: ["Attendance", function () { return "monthly check-in board"; }],
    programs: ["Programmes", function () { return "auto-built splits per member"; }],
    diet: ["Diet planner", function () { return "calories, macros and Indian meal plans"; }],
    payments: ["Payments", function () { return "fees, dues and collection"; }],
    business: ["Business report", function () { return "revenue, retention and churn month by month"; }],
    report: ["Client report", function () { return "printable, brandable progress report"; }],
    settings: ["Settings", function () { return "data, privacy and preferences"; }]
  };

  function render(rt) {
    if (!VIEWS[rt.name]) rt = { name: "today", arg: null, hash: "#/today" };
    if (rt.name !== "settings") M.store.settings.route = rt.hash;
    document.documentElement.setAttribute("data-theme", M.store.settings.theme);
    renderNav(rt);
    renderTop(rt);
    M.renderKpis(rt);
    var host = M.$("#view");
    host.innerHTML = "";
    host.onclick = null;
    if ((rt.name === "member" || rt.name === "report") && !rt.arg) { M.go("#/members"); return; }
    VIEWS[rt.name](host, rt.arg);
    M.save();
    if (w.innerWidth <= 820) closeNav();
    w.scrollTo({ top: 0, behavior: "instant" in document.body.style ? "instant" : "auto" });
  }

  function renderNav(rt) {
    var nav = M.$("#navScroll");
    var html = "";
    NAV.forEach(function (g) {
      if (g.mod && !M.store.settings.modules[g.mod]) return;
      html += '<div class="nav-group"><div class="lbl">' + M.esc(g.lbl) + "</div>";
      g.items.forEach(function (it) {
        var on = rt.hash === it.r || rt.hash.indexOf(it.r + "/") === 0
          || (it.r === "#/members" && rt.name === "member");
        html += '<button class="nav-item' + (on ? " on" : "") + '" data-route="' + it.r + '">'
          + M.icon(it.i) + '<span class="lbl">' + M.esc(it.t) + "</span>"
          + (it.cnt ? '<span class="cnt">' + it.cnt() + "</span>" : "") + "</button>";
      });
      html += "</div>";
    });
    nav.innerHTML = html;
    var st = M.$("#navFoot");
    st.innerHTML = '<button class="nav-item' + (rt.name === "settings" ? " on" : "") + '" data-route="#/settings">'
      + M.icon("settings") + '<span class="lbl">Settings</span></button>'
      + '<div class="who"><div class="av sm" style="background:linear-gradient(150deg,var(--accent),var(--accent-2))">' + M.esc(M.initials(M.store.settings.name)) + "</div>"
      + '<div class="meta"><div class="nm">' + M.esc(M.store.settings.name) + '</div><div class="rl">' + (M.store.gym.profile.name ? M.esc(M.store.gym.profile.name) : "local · private") + "</div></div></div>";
  }

  function renderTop(rt) {
    var t = TITLES[rt.name] || ["Momentum", function () { return ""; }];
    var title = t[0], sub = t[1]();
    if ((rt.name === "member" || rt.name === "report") && rt.arg) {
      var m = G.byId(rt.arg);
      if (m) {
        title = rt.name === "report" ? m.name + " · report" : m.name;
        sub = L.goal[m.goal] + " · " + L.level[m.level] + " · joined " + M.fmtD(m.joined);
      }
    }
    var acts = "";
    if (rt.name === "grid") {
      acts += '<div class="search"><span>' + M.icon("search") + '</span><input id="hq" placeholder="Search habit…"></div>';
    }
    if (rt.name === "today" || rt.name === "grid" || rt.name === "insights") {
      acts += '<button class="btn primary" data-act="addhabit">' + M.icon("plus") + "<span>Habit</span></button>";
    }
    if (["gym", "members", "member", "attendance", "programs", "payments", "log", "diet", "business"].indexOf(rt.name) >= 0) {
      acts += '<button class="btn primary" data-act="addmember">' + M.icon("plus") + "<span>Member</span></button>";
    }
    acts += '<button class="icb" id="themeBtn" title="Switch theme">' + M.icon(M.store.settings.theme === "dark" ? "sun" : "moon") + "</button>";

    M.$("#top").innerHTML =
      '<button class="icb burger" id="burger">' + M.icon("menu") + "</button>"
      + '<div class="ttl"><h1>' + M.esc(title) + "</h1><span>" + M.esc(sub) + "</span></div>"
      + '<div class="top-acts no-print">' + acts + "</div>";

    M.$("#burger").onclick = openNav;
    M.$("#themeBtn").onclick = function () {
      M.store.settings.theme = M.store.settings.theme === "dark" ? "light" : "dark";
      M.saveNow(); M.rerender();
    };
    var hq = M.$("#hq");
    if (hq) {
      hq.value = M.habitQ || "";
      hq.oninput = function (e) { M.habitQ = e.target.value; M.setHabitFilter(e.target.value); VIEWS.grid(M.$("#view")); M.$("#hq").focus(); };
    }
  }

  /* ---------------- KPI strip (personal views) ---------------- */
  M.renderKpis = function (rt) {
    rt = rt || parse();
    var strip = M.$("#kpiStrip");
    if (["today", "grid", "insights"].indexOf(rt.name) < 0) { strip.innerHTML = ""; strip.style.display = "none"; return; }
    strip.style.display = "";
    var tk = M.today(), A = H.active(), done = H.dayDone(tk);
    var todayPct = A.length ? Math.round((done / A.length) * 100) : 0;
    var best = 0, longest = 0;
    A.forEach(function (h) { best = Math.max(best, H.streak(h)); longest = Math.max(longest, H.best(h)); });
    var now = new Date(), dim = now.getDate(), ms = 0, perfect = 0, i;
    for (i = 0; i < dim; i++) {
      var dk = M.keyOf(M.addDays(now, -i));
      var pc = H.dayPct(dk);
      ms += pc;
      if (H.hasData(dk) && pc >= 100) perfect++;
    }
    var monthAvg = Math.round(ms / dim);
    var items = [
      ["target", "Today", todayPct + "<small>%</small>", todayPct],
      ["checkCircle", "Done today", done + "<small> / " + A.length + "</small>", A.length ? (done / A.length) * 100 : 0],
      ["flame", "Active streak", best + "<small> d</small>", Math.min(100, best * 8)],
      ["award", "Best ever", longest + "<small> d</small>", Math.min(100, longest * 5)],
      ["trend", "Month avg", monthAvg + "<small>%</small>", monthAvg],
      ["star", "Perfect days", perfect + "<small> d</small>", Math.min(100, perfect * 8)],
      ["brain", "Mindset", H.mindMonthAvg() + "<small>%</small>", H.mindMonthAvg()]
    ];
    strip.className = "kpis";
    strip.innerHTML = items.map(function (it) {
      return '<div class="glass kpi"><div class="l">' + M.icon(it[0]) + "<span>" + it[1] + '</span></div><div class="v">' + it[2] + "</div>"
        + '<div class="bar"><i style="width:' + M.clamp(it[3], 0, 100) + '%"></i></div></div>';
    }).join("");
  };

  /* ---------------- mobile nav ---------------- */
  function openNav() { M.$("#nav").classList.add("open"); M.$("#navScrim").classList.add("show"); }
  function closeNav() { M.$("#nav").classList.remove("open"); M.$("#navScrim").classList.remove("show"); }

  /* ============================================================
     SETTINGS
     ============================================================ */
  VIEWS.settings = function (host) {
    var s = M.store.settings, gp = M.store.gym.profile;
    var used = 0;
    try { used = Math.round((JSON.stringify(M.store).length / 1024) * 10) / 10; } catch (e) { }
    var arch = M.store.habits.filter(function (h) { return h.arch; });

    host.innerHTML =
      '<div class="pgrid">'
      + sect("user", "You", "shown across the app", '<div id="setYou"></div>')
      + sect("dumbbell", "Gym profile", "used on plans and WhatsApp messages", '<div id="setGym"></div>')
      + sect("layers", "Modules", "hide what you do not use",
        '<div class="rows"><div class="row"><span style="flex:1"><b>Gym Studio</b><div class="sub">Members, attendance, workouts, diet plans and payments</div></span>'
        + '<button class="btn sm ' + (s.modules.gym ? "ok" : "") + '" id="modGym">' + M.icon(s.modules.gym ? "check" : "x") + "<span>" + (s.modules.gym ? "On" : "Off") + "</span></button></div></div>")
      + sect("download", "Backup & data", "everything lives in this browser only",
        '<div style="display:flex;flex-direction:column;gap:8px">'
        + '<button class="btn" id="expJson">' + M.icon("download") + "<span>Download full backup (.json)</span></button>"
        + '<button class="btn" id="expCsv">' + M.icon("download") + "<span>Export habits + mood (.csv)</span></button>"
        + '<button class="btn" id="expMem">' + M.icon("download") + "<span>Export members (.csv)</span></button>"
        + '<button class="btn" id="expWo">' + M.icon("download") + "<span>Export workout log (.csv)</span></button>"
        + '<button class="btn" id="impBtn">' + M.icon("upload") + "<span>Import a backup</span></button>"
        + '<input type="file" id="impFile" accept="application/json" class="hidden">'
        + "</div>"
        + '<div class="note' + (backupAge() > 7 ? " wn" : "") + '" style="margin-top:10px">'
        + "Storage in use: <b>" + used + " KB</b> · last backup: <b>"
        + (s.lastBackup ? M.fmtD(s.lastBackup, "long") + " (" + M.ago(s.lastBackup) + ")" : "never")
        + "</b>. Nothing is uploaded anywhere — clearing browser data deletes it, so download a backup weekly.</div>"
        + '<label class="chk" style="margin-top:10px"><input type="checkbox" id="impMerge"><span>Merge on import instead of replacing everything</span></label>')
      + sect("play", "Demo data", "for showing the product to a gym",
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'
        + '<button class="btn primary" data-act="demo">' + M.icon("layers") + "<span>" + (M.hasDemo() ? "Reload demo gym" : "Load demo gym") + "</span></button>"
        + (M.hasDemo() ? '<button class="btn danger" id="clrDemo">' + M.icon("trash") + "<span>Remove demo members</span></button>" : "")
        + "</div>"
        + '<div class="note" style="margin-top:10px">Creates 12 fictional members with 10 weeks of attendance, workouts, weigh-ins and payments. Your real members are untouched.</div>')
      + sect("lock", "Privacy lock", s.pin ? "PIN is on" : "no PIN set",
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'
        + '<button class="btn" id="setPin">' + M.icon("lock") + "<span>" + (s.pin ? "Change PIN" : "Set a 4-digit PIN") + "</span></button>"
        + (s.pin ? '<button class="btn ghost" id="rmPin">' + M.icon("unlock") + "<span>Remove PIN</span></button>" : "")
        + "</div>"
        + '<div class="note" style="margin-top:10px">The PIN only hides the screen on this device. It is not encryption.</div>')
      + sect("refresh", "Archived habits", arch.length + " archived",
        arch.length ? '<div class="rows">' + arch.map(function (h) {
          return '<div class="row"><span style="font-size:15px;width:20px">' + h.e + '</span><span class="nm" style="flex:1">' + M.esc(h.n) + "</span>"
            + '<button class="btn sm" data-restore="' + h.id + '">' + M.icon("refresh") + "<span>Restore</span></button></div>";
        }).join("") + "</div>" : '<div class="note">Nothing archived.</div>')
      + sect("users", "Archived members", G.trash().length + " archived",
        G.trash().length ? '<div class="rows">' + G.trash().map(function (m) {
          return '<div class="row">' + M.gymAv(m, "sm") + '<span style="flex:1;min-width:0"><span class="nm" style="display:block">' + M.esc(m.name) + "</span>"
            + '<span class="sub">' + M.esc(L.goal[m.goal]) + " · joined " + M.fmtD(m.joined) + " · " + G.visits(m.id).length + " visits kept</span></span>"
            + '<button class="btn sm" data-unarch="' + m.id + '">' + M.icon("refresh") + "<span>Restore</span></button>"
            + '<button class="icb sm" data-purge="' + m.id + '" title="Delete permanently">' + M.icon("trash") + "</button></div>";
        }).join("") + "</div>" : '<div class="note">Nothing archived. Archiving a member keeps all their history but takes them off the roster.</div>')
      + sect("alert", "Danger zone", "these cannot be undone",
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'
        + '<button class="btn danger" id="resetToday">' + M.icon("refresh") + "<span>Reset today’s habits</span></button>"
        + '<button class="btn danger" id="wipeAll">' + M.icon("trash") + "<span>Delete everything</span></button>"
        + "</div>")
      + sect("play", "Setup", "gym name, trainer and starting data",
        '<button class="btn" id="runSetup">' + M.icon("refresh") + "<span>Run the setup wizard again</span></button>")
      + sect("info", "About", "Momentum " + VERSION,
        '<div class="note">Personal discipline tracker + Gym Studio for trainers. Offline-first, installable, no server and no account.'
        + " Habit data, members, workouts and plans are stored in this browser under <b>" + M.KEY + "</b>.</div>")
      + "</div>";

    /* you */
    M.$("#setYou", host).innerHTML =
      '<div class="grid3">' + M.f.text("name", "Your name", s.name)
      + M.f.sel("theme", "Theme", s.theme, [["dark", "Studio (dark)"], ["light", "Daylight (light)"]])
      + M.f.sel("currency", "Currency", s.currency, [["₹", "₹ Rupee"], ["$", "$ Dollar"], ["£", "£ Pound"], ["€", "€ Euro"], ["AED ", "AED Dirham"]]) + "</div>"
      + '<button class="btn primary" id="saveYou" style="margin-top:6px">' + M.icon("check") + "<span>Save</span></button>";
    M.$("#saveYou", host).onclick = function () {
      var v = M.formVals(M.$("#setYou", host));
      s.name = v.name || "You"; s.theme = v.theme; s.currency = v.currency || "₹";
      M.saveNow(); M.rerender(); M.toast("Saved", "ok");
    };
    /* gym */
    M.$("#setGym", host).innerHTML =
      '<div class="grid2">' + M.f.text("gname", "Gym / studio name", gp.name, { ph: "e.g. Iron Yard Fitness" })
      + M.f.text("gtrainer", "Head trainer", gp.trainer, { ph: "your name as shown to clients" }) + "</div>"
      + '<div class="grid2">' + M.f.text("gphone", "Contact number", gp.phone) + M.f.text("gcity", "City", gp.city) + "</div>"
      + '<button class="btn primary" id="saveGym" style="margin-top:6px">' + M.icon("check") + "<span>Save</span></button>";
    M.$("#saveGym", host).onclick = function () {
      var v = M.formVals(M.$("#setGym", host));
      gp.name = v.gname; gp.trainer = v.gtrainer; gp.phone = v.gphone; gp.city = v.gcity;
      M.saveNow(); M.rerender(); M.toast("Gym profile saved", "ok");
    };

    M.$("#modGym", host).onclick = function () {
      s.modules.gym = !s.modules.gym; M.saveNow();
      if (!s.modules.gym) M.go("#/today"); else M.rerender();
    };
    M.$("#expJson", host).onclick = function () {
      M.download(JSON.stringify(M.store, null, 2), "momentum-backup-" + M.today() + ".json", "application/json");
      s.lastBackup = M.today(); M.saveNow();
      M.toast("Backup downloaded", "ok");
      VIEWS.settings(host);
    };
    M.on(host, "click", "[data-unarch]", function (e, t) {
      G.restore(t.dataset.unarch); M.rerender(); M.toast("Member restored", "ok");
    });
    M.on(host, "click", "[data-purge]", function (e, t) {
      var m = M.store.gym.members.filter(function (x) { return x.id === t.dataset.purge; })[0];
      M.confirm("Delete " + (m ? m.name : "this member") + " permanently?",
        "Their profile, attendance, workouts, weigh-ins and payments are removed for good.", "Delete permanently", true)
        .then(function (ok) {
          if (!ok) return;
          G.remove(t.dataset.purge); M.rerender(); M.toast("Deleted permanently", "ok");
        });
    });
    M.$("#expCsv", host).onclick = function () {
      var A = H.active();
      var days = Object.keys(M.store.logs).concat(Object.keys(M.store.mind)).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
      var rows = [["date"].concat(A.map(function (h) { return h.n; })).concat(["mood", "motivation", "score"])];
      days.forEach(function (dk) {
        var mm = M.store.mind[dk] || {};
        rows.push([dk].concat(A.map(function (h) { var v = H.val(dk, h.id); return v == null ? "" : v; }))
          .concat([mm.mood == null ? "" : mm.mood, mm.mot == null ? "" : mm.mot, mm.score == null ? "" : mm.score]));
      });
      M.download(rows.map(function (r) { return r.map(M.csvCell).join(","); }).join("\n"), "momentum-habits-" + M.today() + ".csv", "text/csv");
      M.toast("CSV exported", "ok");
    };
    M.$("#expMem", host).onclick = function () {
      var rows = [["name", "phone", "sex", "age", "joined", "goal", "level", "diet", "height_cm", "start_kg", "current_kg", "target_kg", "bmi", "days_per_week", "plan", "fee", "status", "attendance_pct", "last_visit", "paid_till"]];
      G.all().forEach(function (m) {
        rows.push([m.name, m.phone, m.sex, M.age(m.dob) || "", m.joined, L.goal[m.goal], L.level[m.level], L.diet[m.diet],
          m.height, m.startWeight, M.n1(G.weight(m)), m.targetWeight || "", M.n1(G.bmi(m)), m.daysPerWeek, L.plan[m.plan],
          m.fee, m.status, G.attPct(m.id), G.lastVisit(m.id) || "", G.paidUntil(m)]);
      });
      M.download(rows.map(function (r) { return r.map(M.csvCell).join(","); }).join("\n"), "momentum-members-" + M.today() + ".csv", "text/csv");
      M.toast("Members exported", "ok");
    };
    M.$("#expWo", host).onclick = function () {
      var rows = [["date", "member", "focus", "exercise", "muscle", "set", "weight_kg", "reps", "e1rm", "duration_min", "rpe"]];
      M.store.gym.sessions.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).forEach(function (s) {
        var m = G.byId(s.mid) || { name: "(deleted)" };
        (s.ex || []).forEach(function (e) {
          (e.sets || []).forEach(function (st, i) {
            rows.push([s.d, m.name, L.split[s.split] || s.split, e.name, M.EXDB.label(M.EXDB.muscleOf(e.name)), i + 1, st.w, st.r, M.n1(G.e1rm(st.w, st.r)), s.dur || "", s.rpe || ""]);
          });
        });
      });
      M.download(rows.map(function (r) { return r.map(M.csvCell).join(","); }).join("\n"), "momentum-workouts-" + M.today() + ".csv", "text/csv");
      M.toast("Workout log exported", "ok");
    };
    M.$("#impBtn", host).onclick = function () { M.$("#impFile", host).click(); };
    M.$("#impFile", host).onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      var merge = M.$("#impMerge", host) && M.$("#impMerge", host).checked;
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result);
          if (merge) {
            var added = M.mergeStore(obj);
            M.rerender();
            M.toast("Merged: " + added.members + " members, " + added.sessions + " sessions, " + added.days + " habit days", "ok");
          } else {
            M.replaceStore(obj);
            M.rerender(); M.toast("Backup restored", "ok");
          }
        } catch (err) { M.toast("That file could not be read", "no"); }
      };
      rd.readAsText(f);
    };
    var cd = M.$("#clrDemo", host);
    if (cd) cd.onclick = function () {
      M.confirm("Remove demo members?", "The 12 fictional demo members and their data will be deleted. Your real members stay.", "Remove demo", true)
        .then(function (ok) { if (ok) { var n = M.clearDemo(); M.rerender(); M.toast(n + " demo members removed", "ok"); } });
    };
    M.$("#setPin", host).onclick = function () {
      M.ask("Set PIN", "4-digit PIN", "", { type: "tel", ok: "Set PIN", hint: "Leave empty and cancel to keep the current PIN." }).then(function (v) {
        if (v == null) return;
        if (!/^\d{4}$/.test(v)) { M.toast("Needs exactly 4 digits", "no"); return; }
        M.store.settings.pin = v; M.saveNow(); M.rerender(); M.toast("PIN set", "ok");
      });
    };
    var rp = M.$("#rmPin", host);
    if (rp) rp.onclick = function () { M.store.settings.pin = null; M.saveNow(); M.rerender(); M.toast("PIN removed", "ok"); };
    M.$("#resetToday", host).onclick = function () {
      M.confirm("Reset today?", "Today’s habit marks and mood entries will be cleared.", "Reset today", true).then(function (ok) {
        if (!ok) return;
        delete M.store.logs[M.today()]; delete M.store.mind[M.today()];
        M.saveNow(); M.rerender(); M.toast("Today reset", "ok");
      });
    };
    M.$("#wipeAll", host).onclick = function () {
      M.confirm("Delete everything?", "Habits, logs, members, workouts, plans and payments — all of it. Download a backup first.", "Delete everything", true).then(function (ok) {
        if (!ok) return;
        M.confirm("Are you sure?", "This is the last warning. There is no undo.", "Yes, delete all", true).then(function (ok2) {
          if (!ok2) return;
          var th = M.store.settings.theme, nm = M.store.settings.name;
          M.store = M.fresh();
          M.store.settings.theme = th; M.store.settings.name = nm;
          M.saveNow(); M.go("#/today"); M.toast("Everything reset", "ok");
        });
      });
    };
    M.$("#runSetup", host).onclick = function () { M.onboard(true); };
    M.on(host, "click", "[data-restore]", function (e, t) {
      var h = H.byId(t.dataset.restore);
      if (h) { h.arch = false; M.save(); M.rerender(); M.toast("Habit restored", "ok"); }
    });
  };
  function sect(icon, title, sub, inner) {
    return '<div class="glass card"><div class="card-h"><div class="ic">' + M.icon(icon) + "</div><div><h3>" + M.esc(title) + '</h3><span class="sub">' + M.esc(sub) + "</span></div></div>" + inner + "</div>";
  }

  /* ============================================================
     global actions
     ============================================================ */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-route]");
    if (t) { M.go(t.dataset.route); return; }
    t = e.target.closest("[data-act]");
    if (!t) return;
    var a = t.dataset.act;
    if (a === "addhabit") M.habitModal(null);
    if (a === "addmember") M.memberModal(null);
    if (a === "demo") {
      M.confirm("Load demo gym?", "Adds 12 fictional members with 10 weeks of attendance, workouts, weigh-ins and payments so you can demo the product. Your real data is untouched.", "Load demo")
        .then(function (ok) {
          if (!ok) return;
          if (M.hasDemo()) M.clearDemo();
          M.seedDemo(); M.go("#/gym"); M.rerender(); M.toast("Demo gym loaded", "ok");
        });
    }
  });
  M.$("#navScrim").onclick = closeNav;
  M.$("#drawerScrim").onclick = M.closeDrawer;
  M.$("#modalHost").addEventListener("click", function (e) { if (e.target.id === "modalHost") M.closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { M.closeModal(); M.closeDrawer(); closeNav(); }
    if (M.$("#lockOverlay").classList.contains("show")) {
      if (/^[0-9]$/.test(e.key)) { var k = M.$('#keypad [data-k="' + e.key + '"]'); if (k) k.click(); }
      else if (e.key === "Backspace") { var d = M.$('#keypad [data-k="del"]'); if (d) d.click(); }
      return;
    }
    if (/input|select|textarea/i.test(e.target.tagName)) return;
    if (e.key === "t") M.go("#/today");
    if (e.key === "g") M.go("#/grid");
    if (e.key === "i") M.go("#/insights");
    if (e.key === "m" && M.store.settings.modules.gym) M.go("#/members");
    if (e.key === "/") {
      var q = M.$("#qcin");
      if (q) { e.preventDefault(); q.focus(); }
      else if (M.store.settings.modules.gym) M.go("#/gym");
    }
    if (e.key === "?") M.modal({
      title: "Keyboard shortcuts", narrow: true,
      body: '<div class="rows">'
        + ["t · Today", "g · Habit grid", "i · Insights", "m · Members", "/ · Quick check-in", "Esc · close dialogs"].map(function (x) {
          return '<div class="row"><span class="nm">' + x + "</span></div>";
        }).join("") + "</div>"
    });
  });

  /* ============================================================
     PIN lock
     ============================================================ */
  var entered = "";
  function dots() {
    var d = M.$("#pinDots").children, i;
    for (i = 0; i < 4; i++) d[i].classList.toggle("on", i < entered.length);
  }
  M.showLock = function () { entered = ""; dots(); M.$("#lockOverlay").classList.add("show"); };
  M.$("#keypad").addEventListener("click", function (e) {
    var k = e.target.closest("[data-k]");
    if (!k) return;
    var v = k.dataset.k;
    if (v === "del") { entered = entered.slice(0, -1); dots(); return; }
    if (entered.length >= 4) return;
    entered += v; dots();
    if (entered.length === 4) {
      setTimeout(function () {
        if (entered === M.store.settings.pin) M.$("#lockOverlay").classList.remove("show");
        else {
          M.$("#pinDots").classList.add("err");
          setTimeout(function () { M.$("#pinDots").classList.remove("err"); entered = ""; dots(); }, 450);
        }
      }, 110);
    }
  });

  /* ============================================================
     first-run setup
     ============================================================ */
  M.onboard = function (force) {
    var s = M.store.settings, gp = M.store.gym.profile;
    if (s.onboarded && !force) return;
    var body =
      '<div class="stack">'
      + '<div class="note in">' + M.icon("info")
      + " Everything stays on this device — no account, no server. Two minutes here makes the plans and WhatsApp messages come out branded."
      + "</div>"
      + '<div class="grid2">' + M.f.text("name", "Your name", s.name === "You" ? "" : s.name, { ph: "as clients should see it", req: true })
      + M.f.sel("currency", "Currency", s.currency, [["₹", "₹ Rupee"], ["$", "$ Dollar"], ["£", "£ Pound"], ["€", "€ Euro"], ["AED ", "AED Dirham"]]) + "</div>"
      + '<div class="grid2">' + M.f.text("gname", "Gym / studio name", gp.name, { ph: "e.g. Iron Yard Fitness" })
      + M.f.text("gphone", "Contact number", gp.phone, { ph: "shown on receipts" }) + "</div>"
      + M.f.sel("theme", "Look", s.theme, [["dark", "Studio (dark)"], ["light", "Daylight (light)"]])
      + '<div class="note">Leave the gym fields empty if you only want the personal habit tracker — you can switch Gym Studio off in Settings.</div>'
      + "</div>";
    function apply(b) {
      var v = M.formVals(b);
      s.name = v.name || "You";
      s.currency = v.currency || "₹";
      s.theme = v.theme;
      gp.name = v.gname || "";
      gp.phone = v.gphone || "";
      if (!gp.trainer) gp.trainer = s.name;
      s.onboarded = true;
      M.saveNow();
    }
    M.modal({
      title: "Welcome to Momentum", wide: true,
      sub: "A discipline tracker for you, and a full studio for the gym floor.",
      body: body,
      footer: [
        {
          label: "Start empty", cls: "ghost", fn: function (b) {
            apply(b); M.closeModal(); M.go("#/today"); M.rerender();
          }
        },
        {
          label: "Load a demo gym", cls: "primary", icon: "layers", fn: function (b) {
            apply(b);
            if (M.hasDemo()) M.clearDemo();
            M.seedDemo();
            M.closeModal(); M.go("#/gym"); M.rerender();
            M.toast("Demo gym loaded — remove it any time from Settings", "ok");
          }
        }
      ]
    });
  };
  function backupAge() {
    var lb = M.store.settings.lastBackup;
    if (!lb) return 999;
    return M.dayDiff(lb, new Date());
  }
  M.backupAge = backupAge;
  function backupNag() {
    var hasData = Object.keys(M.store.logs).length > 5 || G.all().length > 0;
    if (!hasData || backupAge() <= 7) return;
    setTimeout(function () {
      M.toast("No backup in " + (M.store.settings.lastBackup ? backupAge() + " days" : "a while") + " — keep one safe copy", "no", "Back up now", function () {
        M.download(JSON.stringify(M.store, null, 2), "momentum-backup-" + M.today() + ".json", "application/json");
        M.store.settings.lastBackup = M.today();
        M.saveNow();
        M.toast("Backup downloaded", "ok");
      });
    }, 2600);
  }

  /* ============================================================
     boot
     ============================================================ */
  w.addEventListener("hashchange", function () { render(parse()); });
  if (!location.hash) location.hash = M.store.settings.route || "#/today";
  render(parse());
  if (M.store.settings.pin) M.showLock();
  else if (!M.store.settings.onboarded) M.onboard();
  else backupNag();
  w.addEventListener("beforeunload", M.saveNow);
  var lastDay = M.today();
  setInterval(function () {
    if (M.today() !== lastDay) { lastDay = M.today(); M.rerender(); }
  }, 60000);
  M.__version = VERSION;
})(window);
