/* ============================================================
   Momentum · gym-log.js — workout logger, attendance board,
   programmes, payments
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, G = M.G, L = M.LBL;
  var VIEWS = (M.VIEWS = M.VIEWS || {});

  /* ============================================================
     WORKOUT LOGGER
     ============================================================ */
  var draft = null, bankQ = "", bankSplit = "";

  function newDraft(mid) {
    var m = G.byId(mid);
    return {
      id: null, mid: mid, d: M.today(),
      split: m && m.program && m.program.days.length ? nextSplit(m) : "full",
      dur: 60, rpe: 7, notes: "", ex: []
    };
  }
  function nextSplit(m) {
    var ss = G.sessions(m.id);
    var days = m.program.days.map(function (d) { return d.split; });
    if (!ss.length) return days[0];
    var i = days.indexOf(ss[0].split);
    return days[(i + 1) % days.length];
  }

  VIEWS.log = function (host, mid) {
    var all = G.active();
    if (!all.length) {
      host.innerHTML = '<div class="glass card">' + M.emptyState("users", "No active members", "Add a member before logging workouts.",
        '<button class="btn primary" style="margin-top:10px" data-act="addmember">' + M.icon("plus") + "<span>Add member</span></button>") + "</div>";
      return;
    }
    mid = mid || (draft && draft.mid) || all[0].id;
    if (!G.byId(mid)) mid = all[0].id;
    if (!draft || draft.mid !== mid) draft = newDraft(mid);
    var m = G.byId(mid);

    host.innerHTML =
      '<div class="logger">'
      + '<div class="glass card" id="sessCard"></div>'
      + '<div style="display:flex;flex-direction:column;gap:16px">'
      + '<div class="glass card" id="bankCard"></div>'
      + '<div class="glass card" id="refCard"></div>'
      + "</div></div>";
    drawSession(host, m);
    drawBank(host, m);
    drawRef(host, m);
  };

  function drawSession(host, m) {
    var box = M.$("#sessCard", host);
    var vol = G.sessionVolume(draft), sets = G.sessionSets(draft);
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("dumbbell") + '</div><div><h3>Log a session</h3><span class="sub">'
      + M.esc(m.name) + " · " + M.esc(L.goal[m.goal]) + " · " + M.esc(L.level[m.level]) + "</span></div>"
      + '<div class="acts"><span class="bdg in">' + sets + ' sets</span><span class="bdg ac">' + vol.toLocaleString("en-IN") + " kg</span></div></div>"
      + '<div class="grid4" style="margin-bottom:14px">'
      + '<div class="fld"><label>Member</label><select class="sel" id="sMid">' + G.active().map(function (x) {
        return '<option value="' + x.id + '"' + (x.id === draft.mid ? " selected" : "") + ">" + M.esc(x.name) + "</option>";
      }).join("") + "</select></div>"
      + '<div class="fld"><label>Date</label><input class="inp" type="date" id="sDate" value="' + draft.d + '"></div>'
      + '<div class="fld"><label>Focus</label><select class="sel" id="sSplit">' + Object.keys(L.split).map(function (k) {
        return '<option value="' + k + '"' + (k === draft.split ? " selected" : "") + ">" + M.esc(L.split[k]) + "</option>";
      }).join("") + "</select></div>"
      + '<div class="grid2" style="gap:8px"><div class="fld"><label>Minutes</label><input class="inp" type="number" id="sDur" value="' + (draft.dur || "") + '" min="5" max="240"></div>'
      + '<div class="fld"><label>RPE</label><input class="inp" type="number" id="sRpe" value="' + (draft.rpe || "") + '" min="1" max="10"></div></div>'
      + "</div>"
      + (m.medical ? '<div class="note no" style="margin-bottom:12px">' + M.icon("alert")
        + " <b>Medical flag:</b> " + M.esc(m.medical) + " — swap any painful movement for a pain-free variation of the same pattern.</div>" : "")
      + '<div id="exWrap"></div>'
      + '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">'
      + '<button class="btn" id="autoFill">' + M.icon("zap") + "<span>Auto-fill from programme</span></button>"
      + '<button class="btn" id="repeatLast">' + M.icon("refresh") + "<span>Repeat last session</span></button>"
      + "</div>"
      + '<div class="fld" style="margin-top:14px"><label>Session notes</label><textarea class="inp" id="sNotes" placeholder="form cues, pain, energy…">' + M.esc(draft.notes || "") + "</textarea></div>"
      + '<div style="display:flex;gap:8px;margin-top:6px">'
      + '<button class="btn primary grow" id="saveSess">' + M.icon("save") + "<span>" + (draft.id ? "Update session" : "Save session") + "</span></button>"
      + '<button class="btn ghost" id="clearSess">' + M.icon("x") + "<span>Clear</span></button>"
      + "</div>";

    var ew = M.$("#exWrap", box);
    if (!draft.ex.length) {
      ew.innerHTML = M.emptyState("plus", "No exercises yet", "Pick from the library on the right, auto-fill from their programme, or repeat their last session.");
    } else {
      ew.innerHTML = '<div class="exlist">' + draft.ex.map(function (e, ei) {
        var sug = G.suggest(draft.mid, e.name, m.goal);
        return '<div class="exrow"><div class="eh">'
          + '<span class="nm">' + M.esc(e.name) + "</span>"
          + '<span class="bdg">' + M.esc(M.EXDB.label(M.EXDB.muscleOf(e.name))) + "</span>"
          + (sug ? '<span class="bdg ac">suggest ' + M.n1(sug.w) + " × " + sug.r + "</span>" : "")
          + '<span style="margin-left:auto;display:flex;gap:4px">'
          + '<button class="icb sm" data-addset="' + ei + '" title="Add set">' + M.icon("plus") + "</button>"
          + '<button class="icb sm" data-delex="' + ei + '" title="Remove exercise">' + M.icon("trash") + "</button></span></div>"
          + '<div class="setgrid" style="margin-top:8px">' + e.sets.map(function (st, si) {
            return '<div class="setrow"><span class="sn">' + (si + 1) + "</span>"
              + '<input class="inp sm" type="number" step="0.5" placeholder="kg" data-w="' + ei + "," + si + '" value="' + (st.w != null ? st.w : "") + '">'
              + '<input class="inp sm" type="number" placeholder="reps" data-r="' + ei + "," + si + '" value="' + (st.r != null ? st.r : "") + '">'
              + '<span class="e1">' + (st.w && st.r ? "e1RM " + M.n1(G.e1rm(st.w, st.r)) : "") + "</span>"
              + '<button class="icb sm bare" data-delset="' + ei + "," + si + '">' + M.icon("minus") + "</button></div>";
          }).join("") + "</div></div>";
      }).join("") + "</div>";
    }

    M.$("#sMid", box).onchange = function (e) { M.go("#/log/" + e.target.value); };
    M.$("#sDate", box).onchange = function (e) { draft.d = e.target.value; };
    M.$("#sSplit", box).onchange = function (e) { draft.split = e.target.value; drawRef(host, m); };
    M.$("#sDur", box).onchange = function (e) { draft.dur = +e.target.value || null; };
    M.$("#sRpe", box).onchange = function (e) { draft.rpe = +e.target.value || null; };
    M.$("#sNotes", box).oninput = function (e) { draft.notes = e.target.value; };

    M.on(ew, "input", "[data-w]", function (e, t) {
      var p = t.dataset.w.split(","); draft.ex[p[0]].sets[p[1]].w = e.target.value === "" ? null : +e.target.value;
      var r = t.closest(".setrow").querySelector(".e1"), s = draft.ex[p[0]].sets[p[1]];
      r.textContent = s.w && s.r ? "e1RM " + M.n1(G.e1rm(s.w, s.r)) : "";
    });
    M.on(ew, "input", "[data-r]", function (e, t) {
      var p = t.dataset.r.split(","); draft.ex[p[0]].sets[p[1]].r = e.target.value === "" ? null : +e.target.value;
      var r = t.closest(".setrow").querySelector(".e1"), s = draft.ex[p[0]].sets[p[1]];
      r.textContent = s.w && s.r ? "e1RM " + M.n1(G.e1rm(s.w, s.r)) : "";
    });
    M.on(ew, "click", "[data-addset]", function (e, t) {
      var ei = +t.dataset.addset, last = draft.ex[ei].sets[draft.ex[ei].sets.length - 1] || { w: null, r: null };
      draft.ex[ei].sets.push({ w: last.w, r: last.r });
      drawSession(host, m);
    });
    M.on(ew, "click", "[data-delset]", function (e, t) {
      var p = t.dataset.delset.split(",");
      draft.ex[p[0]].sets.splice(p[1], 1);
      if (!draft.ex[p[0]].sets.length) draft.ex[p[0]].sets.push({ w: null, r: null });
      drawSession(host, m);
    });
    M.on(ew, "click", "[data-delex]", function (e, t) { draft.ex.splice(+t.dataset.delex, 1); drawSession(host, m); });

    M.$("#autoFill", box).onclick = function () {
      var mm = G.byId(draft.mid);
      if (!mm.program) { G.update(mm.id, { program: M.PROG.build(mm) }); mm = G.byId(draft.mid); }
      var day = mm.program.days.filter(function (d) { return d.split === draft.split; })[0] || mm.program.days[0];
      draft.split = day.split;
      draft.ex = day.ex.map(function (e) {
        var sug = G.suggest(draft.mid, e.name, mm.goal);
        var sets = [], i;
        for (i = 0; i < e.sets; i++) sets.push({ w: sug ? sug.w : null, r: sug ? sug.r : parseInt(e.reps, 10) || null });
        return { name: e.name, sets: sets };
      });
      drawSession(host, mm); drawRef(host, mm);
      M.toast("Filled from programme — adjust the loads", "ok");
    };
    M.$("#repeatLast", box).onclick = function () {
      var ss = G.sessions(draft.mid);
      if (!ss.length) { M.toast("No previous session to repeat", "no"); return; }
      var s = ss[0];
      draft.split = s.split; draft.dur = s.dur; draft.rpe = s.rpe;
      draft.ex = (s.ex || []).map(function (e) {
        return { name: e.name, sets: (e.sets || []).map(function (st) { return { w: st.w, r: st.r }; }) };
      });
      drawSession(host, m); drawRef(host, m);
      M.toast("Copied " + M.fmtD(s.d, "dm") + " session", "ok");
    };
    M.$("#clearSess", box).onclick = function () { draft = newDraft(draft.mid); drawSession(host, m); };
    M.$("#saveSess", box).onclick = function () {
      if (!draft.ex.length) { M.toast("Add at least one exercise", "no"); return; }
      var clean = {
        id: draft.id, mid: draft.mid, d: draft.d, split: draft.split,
        dur: draft.dur, rpe: draft.rpe, notes: draft.notes,
        ex: draft.ex.map(function (e) {
          return { name: e.name, sets: e.sets.filter(function (s) { return s.w != null || s.r != null; }).map(function (s) { return { w: +s.w || 0, r: +s.r || 0 }; }) };
        }).filter(function (e) { return e.sets.length; })
      };
      if (!clean.ex.length) { M.toast("Fill in at least one set", "no"); return; }
      G.saveSession(clean);
      var mid = draft.mid;
      draft = newDraft(mid);
      M.toast("Session saved · member checked in", "ok");
      M.go("#/member/" + mid);
    };
  }

  function drawBank(host, m) {
    var box = M.$("#bankCard", host);
    var list = M.EXDB.search(bankQ, bankSplit || null);
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("list") + '</div><div><h3>Exercise library</h3><span class="sub">' + M.EXDB.LIST.length + " movements · tap to add</span></div></div>"
      + '<div class="search" style="margin-bottom:8px"><span>' + M.icon("search") + '</span><input id="bq" placeholder="Search exercise or muscle…" value="' + M.esc(bankQ) + '"></div>'
      + '<select class="sel" id="bsplit" style="margin-bottom:10px">'
      + '<option value="">All focuses</option>'
      + Object.keys(L.split).map(function (k) { return '<option value="' + k + '"' + (k === bankSplit ? " selected" : "") + ">" + M.esc(L.split[k]) + "</option>"; }).join("")
      + '<option value="mobility"' + (bankSplit === "mobility" ? " selected" : "") + ">Mobility / warm-up</option></select>"
      + '<div class="exbank">' + (list.length ? list.map(function (e) {
        return '<button class="eb" data-add="' + M.esc(e.n) + '">' + M.icon("plus")
          + '<span class="nm">' + M.esc(e.n) + '</span><span class="mu">' + M.esc(M.EXDB.label(e.m)) + " · " + M.esc(e.eq) + "</span></button>";
      }).join("") : '<div class="hint" style="padding:12px">Nothing matches that search.</div>') + "</div>";
    M.$("#bq", box).oninput = function (e) { bankQ = e.target.value; drawBank(host, m); M.$("#bq", box).focus(); };
    M.$("#bsplit", box).onchange = function (e) { bankSplit = e.target.value; drawBank(host, m); };
    /* assignment (not addEventListener) — drawBank runs on every keystroke */
    box.onclick = function (e) {
      var t = e.target.closest("[data-add]");
      if (!t) return;
      var name = t.dataset.add;
      var sug = G.suggest(draft.mid, name, m.goal);
      var n = m.level === "first" ? 2 : m.level === "adv" ? 4 : 3, sets = [], i;
      for (i = 0; i < n; i++) sets.push({ w: sug ? sug.w : null, r: sug ? sug.r : null });
      draft.ex.push({ name: name, sets: sets });
      drawSession(host, m);
      M.toast(name + " added", "ok");
    };
  }

  function drawRef(host, m) {
    var box = M.$("#refCard", host);
    var ss = G.sessions(m.id);
    var same = ss.filter(function (s) { return s.split === draft.split; })[0];
    var prs = G.prs(m.id).slice(0, 5);
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("clock") + '</div><div><h3>Last time</h3><span class="sub">'
      + (same ? M.esc(L.split[same.split] || same.split) + " · " + M.fmtD(same.d, "long") : "no " + M.esc(L.split[draft.split] || draft.split) + " session yet") + "</span></div></div>"
      + (same ? '<div class="exlist">' + (same.ex || []).map(function (e) {
        return '<div class="exrow"><div class="eh"><span class="nm">' + M.esc(e.name) + "</span></div>"
          + '<div class="sets">' + (e.sets || []).map(function (st) { return "<i>" + M.n1(st.w) + " × " + st.r + "</i>"; }).join("") + "</div></div>";
      }).join("") + "</div>" : '<div class="note">Use <b>Auto-fill from programme</b> to start from their plan.</div>')
      + (prs.length ? '<div class="divider"></div><div class="card-h" style="margin:0 0 10px"><div class="ic">' + M.icon("award") + '</div><div><h3>Top lifts</h3><span class="sub">best e1RM</span></div></div>'
        + '<div class="rows">' + prs.map(function (p) {
          return '<div class="row"><span class="nm" style="flex:1">' + M.esc(p.name) + '</span><span class="val">' + M.n1(p.wt) + " × " + p.reps + "</span></div>";
        }).join("") + "</div>" : "");
  }

  /* edit / delete a saved session (from the profile) */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-editsess]");
    if (t) {
      var s = M.store.gym.sessions.filter(function (x) { return x.id === t.dataset.editsess; })[0];
      if (s) {
        draft = {
          id: s.id, mid: s.mid, d: s.d, split: s.split, dur: s.dur, rpe: s.rpe, notes: s.notes,
          ex: (s.ex || []).map(function (x) { return { name: x.name, sets: (x.sets || []).map(function (q) { return { w: q.w, r: q.r }; }) }; })
        };
        M.go("#/log/" + s.mid);
      }
      return;
    }
    t = e.target.closest("[data-delsess]");
    if (t) {
      M.confirm("Delete this session?", "The logged sets will be removed. Attendance for that day stays.", "Delete", true).then(function (ok) {
        if (ok) { G.delSession(t.dataset.delsess); M.rerender(); M.toast("Session deleted", "ok"); }
      });
    }
  });

  /* ============================================================
     ATTENDANCE BOARD
     ============================================================ */
  var attRef = new Date(); attRef.setDate(1);
  VIEWS.attendance = function (host) {
    var y = attRef.getFullYear(), mo = attRef.getMonth(), dim = M.daysIn(y, mo), tk = M.today();
    var list = G.all().filter(function (m) { return m.status !== "left"; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (!list.length) {
      host.innerHTML = '<div class="glass card">' + M.emptyState("calendar", "No members to track", "Add members to use the attendance board.") + "</div>";
      return;
    }
    var h = '<div class="glass mnav">'
      + '<button class="icb" id="aPrev">' + M.icon("chevL") + "</button>"
      + "<h2>" + M.MONTHS[mo] + " " + y + "</h2>"
      + '<button class="icb" id="aNext">' + M.icon("chevR") + "</button>"
      + '<button class="btn sm" id="aToday">' + M.icon("target") + "<span>This month</span></button>"
      + '<div class="lg-inline"><span><b>Click</b> a cell to mark attendance</span><span>' + list.length + " members</span></div></div>"
      + '<div class="glass att-wrap" id="attWrap"></div>';
    host.innerHTML = h;

    var t = '<table class="att"><thead><tr><th class="corner" style="position:sticky;left:0;z-index:6">Member</th>', d;
    for (d = 1; d <= dim; d++) {
      var dt = new Date(y, mo, d), dk = M.keyOf(dt);
      t += '<th' + (dk === tk ? ' style="background:var(--accent);color:var(--on-accent)"' : "") + ">"
        + '<div style="font-size:8.5px;opacity:.75">' + M.DOW[dt.getDay()][0] + "</div>" + d + "</th>";
    }
    t += '<th style="min-width:64px">Total</th></tr></thead><tbody>';
    list.forEach(function (m) {
      var n = 0;
      var row = "";
      for (d = 1; d <= dim; d++) {
        var dk = M.keyOf(new Date(y, mo, d)), inn = G.isIn(m.id, dk);
        if (inn) n++;
        row += '<td><div class="acell' + (inn ? " in" : "") + '" data-att="' + m.id + "|" + dk + '">' + (inn ? M.icon("check") : "") + "</div></td>";
      }
      t += '<tr><th><div style="display:flex;align-items:center;gap:8px">' + M.gymAv(m, "sm")
        + '<span style="min-width:0"><span style="display:block;font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + M.esc(m.name) + "</span>"
        + '<span style="font-size:9.5px;color:var(--muted)">' + (m.daysPerWeek || 4) + "×/wk target</span></span></div></th>" + row
        + '<td style="font-weight:700;font-size:11px">' + n + "</td></tr>";
    });
    t += "</tbody></table>";
    M.$("#attWrap", host).innerHTML = t;

    M.$("#aPrev", host).onclick = function () { attRef = new Date(y, mo - 1, 1); VIEWS.attendance(host); };
    M.$("#aNext", host).onclick = function () { attRef = new Date(y, mo + 1, 1); VIEWS.attendance(host); };
    M.$("#aToday", host).onclick = function () { attRef = new Date(); attRef.setDate(1); VIEWS.attendance(host); };
    M.on(M.$("#attWrap", host), "click", "[data-att]", function (e, t2) {
      var p = t2.dataset.att.split("|");
      G.toggleIn(p[0], p[1]);
      VIEWS.attendance(host);
      M.renderKpis();
    });
  };

  /* ============================================================
     PROGRAMMES
     ============================================================ */
  var progSel = null;
  VIEWS.programs = function (host) {
    var list = G.active();
    if (!list.length) {
      host.innerHTML = '<div class="glass card">' + M.emptyState("layers", "No active members", "Programmes are generated per member.") + "</div>";
      return;
    }
    if (!progSel || !G.byId(progSel)) progSel = list[0].id;
    var m = G.byId(progSel);

    host.innerHTML =
      '<div class="logger">'
      + '<div class="glass card" id="progBox"></div>'
      + '<div class="glass card">'
      + '<div class="card-h"><div class="ic">' + M.icon("users") + '</div><div><h3>Members</h3><span class="sub">' + list.length + " active</span></div></div>"
      + '<div class="rows" style="max-height:520px;overflow:auto">' + list.map(function (x) {
        return '<div class="row" style="cursor:pointer" data-psel="' + x.id + '">' + M.gymAv(x, "sm")
          + '<span style="flex:1;min-width:0"><span class="nm" style="display:block">' + M.esc(x.name) + "</span>"
          + '<span class="sub">' + (x.daysPerWeek || 4) + "×/wk · " + M.esc(L.goal[x.goal]) + "</span></span>"
          + '<span class="bdg ' + (x.program ? "ok" : "wn") + '">' + (x.program ? "assigned" : "none") + "</span></div>";
      }).join("") + "</div>"
      + '<div class="divider"></div>'
      + '<button class="btn block" id="genAll">' + M.icon("zap") + "<span>Generate for everyone missing one</span></button>"
      + "</div></div>";

    drawProg(host, m);
    host.onclick = function (e) {
      var t = e.target.closest("[data-psel]");
      if (t) { progSel = t.dataset.psel; VIEWS.programs(host); }
    };
    M.$("#genAll", host).onclick = function () {
      var n = 0;
      G.active().forEach(function (x) { if (!x.program) { G.update(x.id, { program: M.PROG.build(x) }); n++; } });
      VIEWS.programs(host);
      M.toast(n ? n + " programme" + (n === 1 ? "" : "s") + " generated" : "Everyone already has one", "ok");
    };
  };
  function drawProg(host, m) {
    var box = M.$("#progBox", host);
    var pg = m.program;
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("layers") + "</div><div><h3>" + M.esc(m.name) + "</h3>"
      + '<span class="sub">' + (pg ? M.esc(pg.name) + " · created " + M.fmtD(pg.created, "dm") : "no programme assigned") + "</span></div>"
      + '<div class="acts">'
      + '<button class="btn sm primary" data-prog="' + m.id + '">' + M.icon(pg ? "refresh" : "zap") + "<span>" + (pg ? "Regenerate" : "Generate") + "</span></button>"
      + (pg ? ' <button class="btn sm" data-progtext="' + m.id + '">' + M.icon("message") + "<span>Send</span></button>"
        + ' <button class="icb sm" id="progPrint" title="Print">' + M.icon("print") + "</button>" : "")
      + "</div></div>"
      + (pg ? '<div class="grid3" style="margin-bottom:14px">'
        + '<div class="sbox"><div class="v">' + pg.daysPerWeek + '</div><div class="l">Days / week</div></div>'
        + '<div class="sbox"><div class="v">' + M.esc(L.level[pg.level]) + '</div><div class="l">Level</div></div>'
        + '<div class="sbox"><div class="v">' + M.esc(L.goal[pg.goal]) + '</div><div class="l">Goal</div></div>'
        + "</div>"
        + '<div class="prog">' + pg.days.map(function (d) {
          return '<div class="pday"><div class="ph"><b>' + M.esc(d.name) + '</b><span class="dn">' + M.esc(d.day) + "</span></div>"
            + '<div class="hint" style="margin-bottom:6px">Warm-up: ' + M.esc(d.warmup) + "</div>"
            + "<ol>" + d.ex.map(function (e) {
              return "<li>" + M.esc(e.name) + " <span>" + e.sets + " × " + M.esc(e.reps) + " · rest " + M.esc(e.rest) + "</span>"
                + (e.note ? '<div class="hint">' + M.esc(e.note) + "</div>" : "") + "</li>";
            }).join("") + "</ol>"
            + (d.finisher ? '<div class="hint" style="margin-top:7px">Finisher: ' + M.esc(d.finisher) + "</div>" : "") + "</div>";
        }).join("") + "</div>"
        + '<div class="note in" style="margin-top:14px"><b>Cardio:</b> ' + M.esc(pg.cardio) + "</div>"
        + pg.notes.map(function (n) { return '<div class="note" style="margin-top:8px">' + M.esc(n) + "</div>"; }).join("")
        : M.emptyState("zap", "Generate a programme",
          "It uses their days per week, experience level and goal to pick a split, exercises, sets, reps and rest — then you can regenerate or log from it.",
          '<button class="btn primary" style="margin-top:10px" data-prog="' + m.id + '">' + M.icon("zap") + "<span>Generate now</span></button>"));
    var pp = M.$("#progPrint", box);
    if (pp) pp.onclick = function () { window.print(); };
  }

  /* ============================================================
     PAYMENTS
     ============================================================ */
  VIEWS.payments = function (host) {
    var all = G.all(), pays = G.payments(null), tk = M.today(), now = new Date();
    var ym = tk.slice(0, 7);
    var dues = G.dues();
    var months = [], i;
    for (i = 5; i >= 0; i--) {
      var d = M.addMonths(now, -i), k = M.keyOf(d).slice(0, 7);
      months.push({ label: M.MON[d.getMonth()], value: G.revenue(k), hi: i === 0, color: i === 0 ? "var(--accent)" : "var(--info)" });
    }
    host.innerHTML =
      '<div class="kpis">'
      + '<div class="glass kpi"><div class="l">' + M.icon("wallet") + "<span>This month</span></div><div class=\"v\">" + M.money(G.revenue(ym)) + '</div><div class="d">' + pays.filter(function (p) { return p.d.slice(0, 7) === ym; }).length + " payments</div></div>"
      + '<div class="glass kpi"><div class="l">' + M.icon("trend") + "<span>Expected / month</span></div><div class=\"v\">" + M.money(G.expectedMonthly()) + '</div><div class="d">from ' + G.active().length + " active plans</div></div>"
      + '<div class="glass kpi"><div class="l">' + M.icon("alert") + "<span>Outstanding</span></div><div class=\"v\">" + M.money(M.sum(dues, function (x) { return +x.m.fee || 0; })) + '</div><div class="d">' + dues.length + " members</div></div>"
      + '<div class="glass kpi"><div class="l">' + M.icon("award") + "<span>Lifetime collected</span></div><div class=\"v\">" + M.money(M.sum(pays, function (p) { return +p.amt || 0; })) + '</div><div class="d">' + pays.length + " payments recorded</div></div>"
      + "</div>"
      + '<div class="pgrid">'
      + '<div class="glass card span2"><div class="card-h"><div class="ic">' + M.icon("chart") + '</div><div><h3>Collection trend</h3><span class="sub">last 6 months</span></div></div>'
      + M.columns(months, { fmt: function (v) { return v >= 1000 ? Math.round(v / 1000) + "k" : v; }, style: "height:170px" }) + "</div>"
      + '<div class="glass card"><div class="card-h"><div class="ic">' + M.icon("alert") + '</div><div><h3>Due & overdue</h3><span class="sub">' + dues.length + " to collect</span></div></div>"
      + (dues.length ? '<div class="rows">' + dues.map(function (x) {
        return '<div class="row"><span data-open="' + x.m.id + '" style="flex:1;min-width:0;cursor:pointer"><span class="nm" style="display:block">' + M.esc(x.m.name) + "</span>"
          + '<span class="sub">' + M.esc(L.plan[x.m.plan]) + " · " + M.money(x.m.fee) + "</span></span>"
          + '<span class="bdg ' + x.st.cls + '">' + M.esc(x.st.label) + "</span>"
          + '<button class="icb sm" data-pay="' + x.m.id + '" title="Record payment">' + M.icon("plus") + "</button></div>";
      }).join("") + "</div>" : '<div class="note in">Everything is collected. Nothing pending.</div>') + "</div>"
      + '<div class="glass card"><div class="card-h"><div class="ic">' + M.icon("refresh") + '</div><div><h3>Renewals coming up</h3><span class="sub">next 14 days</span></div></div>'
      + (G.expiring(14).length ? '<div class="rows">' + G.expiring(14).map(function (x) {
        return '<div class="row"><span data-open="' + x.m.id + '" style="flex:1;min-width:0;cursor:pointer"><span class="nm" style="display:block">' + M.esc(x.m.name) + "</span>"
          + '<span class="sub">' + M.esc(L.plan[x.m.plan]) + " · " + M.money(x.m.fee) + " · till " + M.fmtD(G.paidUntil(x.m), "dm") + "</span></span>"
          + '<span class="bdg ' + (x.days <= 3 ? "wn" : "") + '">' + (x.days === 0 ? "today" : "in " + x.days + "d") + "</span>"
          + '<button class="icb sm" data-pay="' + x.m.id + '" title="Record renewal">' + M.icon("plus") + "</button></div>";
      }).join("") + "</div>" : '<div class="note in">No memberships expiring in the next two weeks.</div>') + "</div>"
      + '<div class="glass card full"><div class="card-h"><div class="ic">' + M.icon("list") + '</div><div><h3>Payment history</h3><span class="sub">' + pays.length + " records</span></div>"
      + '<div class="acts"><button class="btn sm" id="expPay">' + M.icon("download") + "<span>CSV</span></button></div></div>"
      + (pays.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Receipt</th><th>Date</th><th>Member</th><th>Plan</th><th>Months</th><th>Mode</th><th class="r">Amount</th><th></th></tr></thead><tbody>'
        + pays.slice(0, 60).map(function (p) {
          var m = G.byId(p.mid) || { name: "(deleted)", plan: "monthly" };
          return '<tr><td><span class="nm">' + M.esc(p.rcpt || "—") + "</span></td><td>" + M.fmtD(p.d)
            + '</td><td><span class="nm">' + M.esc(m.name) + "</span></td><td>" + M.esc(L.plan[m.plan] || "") + "</td>"
            + "<td>" + p.months + "</td><td>" + M.esc(L.mode[p.mode] || p.mode || "") + '</td><td class="r">' + M.money(p.amt) + "</td>"
            + '<td class="r" style="white-space:nowrap"><button class="icb sm" data-rcpt="' + p.id + '" title="Receipt">' + M.icon("print") + "</button> "
            + '<button class="icb sm" data-delpay="' + p.id + '" title="Delete">' + M.icon("trash") + "</button></td></tr>";
        }).join("") + "</tbody></table></div>" : '<div class="note">No payments recorded yet. Use <b>Record payment</b> on a member profile.</div>')
      + "</div></div>";

    var ex = M.$("#expPay", host);
    if (ex) ex.onclick = function () {
      var rows = [["receipt", "date", "member", "phone", "plan", "months", "mode", "amount", "note"]];
      pays.forEach(function (p) {
        var m = G.byId(p.mid) || {};
        rows.push([p.rcpt || "", p.d, m.name || "", m.phone || "", m.plan || "", p.months, p.mode, p.amt, p.note || ""]);
      });
      M.download(rows.map(function (r) { return r.map(M.csvCell).join(","); }).join("\n"), "momentum-payments-" + M.today() + ".csv", "text/csv");
      M.toast("Payments exported", "ok");
    };
  };
})(window);
