/* ============================================================
   Momentum · diet.js — Diet Plan Generator view
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, G = M.G, L = M.LBL;
  var VIEWS = (M.VIEWS = M.VIEWS || {});

  var QUICK = "__quick";
  var quick = {
    id: QUICK, name: "Walk-in client", sex: "m", dob: "", height: 172, startWeight: 75, targetWeight: 0,
    goal: "fatloss", level: "first", activity: "light", diet: "veg", allergies: [], meals: 4, daysPerWeek: 4,
    medical: "", joined: M.today(), status: "active", plan: "monthly", fee: 0
  };
  var sel = null, plan = null, dayIdx = 0;

  function subject() {
    if (sel === QUICK) return quick;
    var m = G.byId(sel);
    return m || quick;
  }

  VIEWS.diet = function (host, mid) {
    var list = G.all();
    if (mid && G.byId(mid)) { if (sel !== mid) { sel = mid; plan = null; } }
    if (!sel) sel = list.length ? list[0].id : QUICK;
    var m = subject();
    if (!plan && m.dietPlan && m.id !== QUICK) { plan = m.dietPlan; dayIdx = 0; }
    /* show something useful immediately — a first plan is generated on open */
    if (!plan && m.id !== QUICK) {
      plan = M.NUT.plan(m);
      dayIdx = 0;
      G.update(m.id, { dietPlan: plan });
    }
    var T = M.NUT.targets(m);

    host.innerHTML =
      '<div class="dietwrap">'
      + '<div style="display:flex;flex-direction:column;gap:16px" class="no-print">'
      + '<div class="glass card" id="dietForm"></div>'
      + '<div class="glass card" id="dietTargets"></div>'
      + "</div>"
      + '<div id="dietOut"></div>'
      + "</div>";
    drawForm(host);
    drawTargets(host, T);
    drawPlan(host);
  };

  function drawForm(host) {
    var m = subject(), list = G.all();
    var box = M.$("#dietForm", host);
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("utensils") + '</div><div><h3>Diet plan generator</h3><span class="sub">Indian foods · goal + experience aware</span></div></div>'
      + '<div class="stack">'
      + '<div class="fld"><label>Client</label><select class="sel" id="dSel">'
      + list.map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? " selected" : "") + ">" + M.esc(x.name) + "</option>"; }).join("")
      + '<option value="' + QUICK + '"' + (sel === QUICK ? " selected" : "") + ">— Quick calculator (no member) —</option></select></div>"
      + '<div class="divider"></div>'
      + '<div class="grid2">' + M.f.sel("sex", "Sex", m.sex, [["m", "Male"], ["f", "Female"]])
      + M.f.num("age", "Age", M.age(m.dob) || 28, { min: 12, max: 90 }) + "</div>"
      + '<div class="grid2">' + M.f.num("height", "Height (cm)", m.height, { min: 120, max: 220 })
      + M.f.num("weight", "Weight (kg)", M.n1(G.weight(m)), { step: "0.1", min: 30, max: 250 }) + "</div>"
      + M.f.sel("goal", "Goal", m.goal, M.f.dictOpts(L.goal))
      + M.f.sel("level", "Experience level", m.level, M.f.dictOpts(L.level), { hint: "First-timers and comeback clients get a gentler deficit and lower protein target." })
      + M.f.sel("activity", "Daily activity (outside gym)", m.activity, M.f.dictOpts(L.activity))
      + '<div class="grid2">' + M.f.sel("diet", "Diet preference", m.diet, M.f.dictOpts(L.diet))
      + M.f.num("meals", "Meals per day", m.meals, { min: 3, max: 6 }) + "</div>"
      + M.f.num("daysPerWeek", "Training days / week", m.daysPerWeek, { min: 2, max: 6 })
      + M.f.checks("allergies", "Avoid", m.allergies, M.FOODS.ALLERGENS)
      + "</div>"
      + '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button class="btn primary grow" id="dGen">' + M.icon("zap") + "<span>" + (plan ? "Regenerate plan" : "Generate 7-day plan") + "</span></button>"
      + "</div>";

    M.$("#dSel", box).onchange = function (e) { sel = e.target.value; plan = null; dayIdx = 0; VIEWS.diet(host); };
    M.$("#dGen", box).onclick = function () {
      var v = M.formVals(box);
      applyForm(v);
      var mm = subject();
      plan = M.NUT.plan(mm, { seed: mm.id + "|" + Date.now() });
      dayIdx = 0;
      if (mm.id !== QUICK) G.update(mm.id, { dietPlan: plan });
      VIEWS.diet(host);
      M.toast("Plan generated" + (mm.id !== QUICK ? " and saved to profile" : ""), "ok");
    };
    /* live target preview on any change */
    M.$$(".inp,.sel", box).forEach(function (i) {
      i.addEventListener("change", function () {
        applyForm(M.formVals(box));
        drawTargets(host, M.NUT.targets(subject()));
      });
    });
  }
  function applyForm(v) {
    var m = subject();
    var patch = {
      sex: v.sex, height: +v.height || m.height, goal: v.goal, level: v.level,
      activity: v.activity, diet: v.diet, meals: M.clamp(+v.meals || 4, 3, 6),
      daysPerWeek: M.clamp(+v.daysPerWeek || 4, 2, 6), allergies: v.allergies || []
    };
    if (v.age) patch.dob = M.keyOf(new Date(new Date().getFullYear() - (+v.age), 5, 15));
    if (m.id === QUICK) {
      Object.assign(quick, patch, { startWeight: +v.weight || quick.startWeight });
    } else {
      G.update(m.id, patch);
      /* a weight typed here is recorded as today's weigh-in */
      var cur = G.weight(m);
      if (v.weight && Math.abs(+v.weight - cur) > .05) G.addMetric(m.id, { d: M.today(), w: +v.weight });
    }
  }

  function drawTargets(host, T) {
    var box = M.$("#dietTargets", host);
    var m = subject();
    box.innerHTML =
      '<div class="card-h"><div class="ic">' + M.icon("target") + '</div><div><h3>Daily targets</h3><span class="sub">Mifflin-St Jeor × activity</span></div></div>'
      + '<div class="macros" style="margin-bottom:12px">'
      + '<div class="macro"><b>' + T.kcal + "</b><span>kcal</span><small>" + (T.deficit > 0 ? "-" + T.deficit : T.deficit < 0 ? "+" + -T.deficit : "maintain") + "</small></div>"
      + '<div class="macro"><b>' + T.protein + "</b><span>protein</span><small>" + T.perKg + " g/kg</small></div>"
      + '<div class="macro"><b>' + T.carbs + "</b><span>carbs</span><small>" + Math.round((T.carbs * 4 / T.kcal) * 100) + "%</small></div>"
      + '<div class="macro"><b>' + T.fat + "</b><span>fat</span><small>" + Math.round((T.fat * 9 / T.kcal) * 100) + "%</small></div>"
      + "</div>"
      + '<div class="rows">'
      + trow("BMR (at rest)", T.bmr + " kcal")
      + trow("TDEE (maintenance)", T.tdee + " kcal")
      + trow("BMI", T.bmi + " · " + G.bmiLabel(T.bmi))
      + trow("Water", (T.water / 1000).toFixed(1) + " L/day")
      + trow("Fibre", T.fibre + " g/day")
      + "</div>"
      + (T.floored ? '<div class="note wn" style="margin-top:10px">Calories were raised to a safe floor — a deeper deficit would go under this client’s baseline.</div>' : "");
  }
  function trow(l, v) {
    return '<div class="row"><span class="nm" style="flex:1">' + M.esc(l) + '</span><span class="val" style="min-width:96px">' + M.esc(v) + "</span></div>";
  }

  function drawPlan(host) {
    var box = M.$("#dietOut", host);
    var m = subject();
    if (!plan) {
      box.innerHTML = '<div class="glass card">' + M.emptyState("apple", "No plan generated yet",
        "Set the client details on the left and generate a 7-day rotating meal plan built from Indian foods, portioned to hit their calorie and protein targets.") + "</div>";
      return;
    }
    var T = plan.targets;
    var day = plan.days[M.clamp(dayIdx, 0, plan.days.length - 1)];

    box.innerHTML =
      '<div class="glass card">'
      + '<div class="card-h"><div class="ic">' + M.icon("clipboard") + "</div><div><h3>" + M.esc(m.name) + " · meal plan</h3>"
      + '<span class="sub">' + M.esc(L.goal[m.goal]) + " · " + M.esc(L.diet[m.diet]) + " · " + (m.meals || 4) + " meals · generated " + M.fmtD(plan.created, "long") + "</span></div>"
      + '<div class="acts no-print">'
      + '<button class="btn sm" id="dWa">' + M.icon("message") + "<span>Send</span></button>"
      + '<button class="btn sm" id="dCopy">' + M.icon("copy") + "<span>Copy</span></button>"
      + '<button class="btn sm" id="dShop">' + M.icon("list") + "<span>Shopping list</span></button>"
      + '<button class="btn sm" id="dCsv">' + M.icon("download") + "<span>CSV</span></button>"
      + '<button class="icb sm" id="dPrint" title="Print">' + M.icon("print") + "</button>"
      + "</div></div>"

      + '<div class="daytabs no-print" style="margin-bottom:12px">' + plan.days.map(function (d, i) {
        return '<button class="' + (i === dayIdx ? "on" : "") + '" data-day="' + i + '">Day ' + (i + 1) + "</button>";
      }).join("") + "</div>"

      + '<div class="grid4" style="margin-bottom:14px">'
      + meter("Calories", day.totals.kcal, T.kcal, "kcal")
      + meter("Protein", day.totals.p, T.protein, "g")
      + meter("Carbs", day.totals.c, T.carbs, "g")
      + meter("Fat", day.totals.f, T.fat, "g")
      + "</div>"

      + day.meals.map(function (ml, mi) {
        return '<div class="meal"><div class="mh"><span class="tm">' + M.esc(ml.time) + "</span><b>" + M.esc(ml.label) + "</b>"
          + '<span class="kc">' + ml.totals.kcal + " kcal · P" + ml.totals.p + " C" + ml.totals.c + " F" + ml.totals.f + "</span></div>"
          + "<table>" + ml.items.map(function (it, ii) {
            return "<tr><td>" + M.esc(it.name) + '</td><td class="q">' + M.esc(it.qty) + "</td>"
              + '<td class="n">' + it.kcal + " kcal · P" + M.n1(it.p) + "</td>"
              + '<td class="n no-print" style="width:34px"><button class="icb sm bare swap" data-swap="' + mi + "," + ii + '" title="Swap this item">' + M.icon("refresh") + "</button></td></tr>";
          }).join("") + "</table></div>";
      }).join("")

      + '<div class="note in" style="margin-top:14px">' + M.icon("droplet")
      + " Water <b>" + (plan.hydration / 1000).toFixed(1) + " L</b> across the day · fibre <b>" + plan.fibre + " g</b> · add 500 ml extra on training days.</div>"

      + '<div class="divider"></div>'
      + '<div class="card-h" style="margin:6px 0 10px"><div class="ic">' + M.icon("info") + '</div><div><h3>How to use this plan</h3></div></div>'
      + plan.rules.map(function (r) { return '<div class="note" style="margin-bottom:8px">' + M.esc(r) + "</div>"; }).join("")

      + '<div class="card-h" style="margin:16px 0 10px"><div class="ic">' + M.icon("heart") + '</div><div><h3>Coach notes</h3><span class="sub">tailored to goal, level and diet</span></div></div>'
      + plan.notes.map(function (n) { return '<div class="note" style="margin-bottom:8px">' + M.esc(n) + "</div>"; }).join("")

      + '<div class="card-h" style="margin:16px 0 10px"><div class="ic">' + M.icon("zap") + '</div><div><h3>Supplements</h3><span class="sub">optional — food first</span></div></div>'
      + '<div class="rows">' + plan.supplements.map(function (s) {
        return '<div class="row" style="align-items:flex-start"><span style="flex:1"><b style="font-size:12px">' + M.esc(s.n) + '</b><div class="sub" style="white-space:normal">' + M.esc(s.d) + "</div></span>"
          + '<span class="bdg ' + (s.opt ? "" : "wn") + '">' + (s.opt ? "optional" : "advised") + "</span></div>";
      }).join("") + "</div>"
      + "</div>";

    /* assignment (not addEventListener) — drawPlan re-runs on every day tab / swap */
    box.onclick = function (e) {
      var t = e.target.closest("[data-day]");
      if (t) { dayIdx = +t.dataset.day; drawPlan(host); return; }
      t = e.target.closest("[data-swap]");
      if (!t) return;
      var p = t.dataset.swap.split(","), ml = day.meals[p[0]], it = ml.items[p[1]];
      var food = M.FOODS.find(it.name);
      if (!food) return;
      var pool = M.FOODS.pool(m.diet, m.allergies, food.r, ml.key === "pre" || ml.key === "post" ? ml.key : ml.key)
        .filter(function (f) { return f.n !== food.n; });
      if (!pool.length) { M.toast("No alternative in this category", "no"); return; }
      var next = pool[Math.floor(Math.random() * pool.length)];
      /* keep the same macro contribution for this food's role */
      var keyMacro = food.r === "p" ? "p" : food.r === "c" ? "c" : food.r === "f" ? "f" : "kcal";
      var per = next[keyMacro] / next.bq;
      var amount = per ? M.clamp(Math.round((it[keyMacro === "kcal" ? "kcal" : keyMacro] / per) / next.st) * next.st, next.mn, next.mx) : next.bq;
      var mac = M.FOODS.macro(next, amount);
      ml.items[p[1]] = {
        name: next.n, qty: M.FOODS.qty(next, amount), amount: amount, unit: next.bu,
        kcal: Math.round(mac.kcal), p: Math.round(mac.p * 10) / 10, c: Math.round(mac.c * 10) / 10, f: Math.round(mac.f * 10) / 10
      };
      ml.totals = {
        kcal: Math.round(M.sum(ml.items, function (x) { return x.kcal; })),
        p: Math.round(M.sum(ml.items, function (x) { return x.p; })),
        c: Math.round(M.sum(ml.items, function (x) { return x.c; })),
        f: Math.round(M.sum(ml.items, function (x) { return x.f; }))
      };
      var all = [];
      day.meals.forEach(function (x) { all = all.concat(x.items); });
      day.totals = {
        kcal: Math.round(M.sum(all, function (x) { return x.kcal; })),
        p: Math.round(M.sum(all, function (x) { return x.p; })),
        c: Math.round(M.sum(all, function (x) { return x.c; })),
        f: Math.round(M.sum(all, function (x) { return x.f; }))
      };
      if (m.id !== QUICK) G.update(m.id, { dietPlan: plan });
      drawPlan(host);
    };

    M.$("#dCopy", box).onclick = function () {
      M.copy(M.NUT.text(plan, m)).then(function () { M.toast("Plan copied to clipboard", "ok"); });
    };
    M.$("#dWa", box).onclick = function () {
      var txt = M.NUT.text(plan, m);
      if (m.phone) window.open(M.wa(m.phone, txt), "_blank");
      else M.copy(txt).then(function () { M.toast("Copied — no phone number on file", "ok"); });
    };
    M.$("#dCsv", box).onclick = function () {
      M.download(M.NUT.csv(plan), "diet-" + m.name.replace(/\s+/g, "-").toLowerCase() + "-" + M.today() + ".csv", "text/csv");
      M.toast("Plan exported", "ok");
    };
    M.$("#dPrint", box).onclick = function () { window.print(); };
    M.$("#dShop", box).onclick = function () { shoppingList(m, plan); };
  }
  /* aggregate a week of meals into a buy-list, grouped by aisle */
  function shoppingList(m, pl) {
    var agg = {};
    pl.days.forEach(function (d) {
      d.meals.forEach(function (ml) {
        ml.items.forEach(function (it) {
          var f = M.FOODS.find(it.name);
          if (!f) return;
          var k = it.name;
          agg[k] = agg[k] || { f: f, amount: 0 };
          agg[k].amount += it.amount;
        });
      });
    });
    var GROUPS = { p: "Protein", c: "Grains & carbs", v: "Vegetables", f: "Fats, nuts & seeds", fr: "Fruit", d: "Drinks", x: "Extras" };
    var byRole = {};
    Object.keys(agg).forEach(function (k) {
      var r = agg[k].f.r;
      (byRole[r] = byRole[r] || []).push(agg[k]);
    });
    var order = ["p", "c", "v", "fr", "f", "d", "x"], html = "", text = [];
    text.push("*Shopping list — " + (m.name || "client") + "* (7 days)");
    order.forEach(function (r) {
      var list = byRole[r];
      if (!list || !list.length) return;
      list.sort(function (a, b) { return a.f.n.localeCompare(b.f.n); });
      html += '<div class="rep-sect" style="margin-bottom:14px"><h3>' + M.esc(GROUPS[r] || r) + "</h3>"
        + '<table class="rep-tbl"><tbody>' + list.map(function (x) {
          var amt = x.amount;
          var pretty = M.FOODS.qty(x.f, Math.round(amt * 10) / 10);
          /* grams and millilitres read better in kg / litre once they are big */
          if ((x.f.bu === "g" || x.f.bu === "ml") && amt >= 1000) {
            pretty = M.n1(amt / 1000) + (x.f.bu === "g" ? " kg" : " L");
          }
          text.push("• " + x.f.n + " — " + pretty);
          return "<tr><td>" + M.esc(x.f.n) + '</td><td class="r"><b>' + M.esc(pretty) + "</b></td></tr>";
        }).join("") + "</tbody></table></div>";
      text.push("");
    });
    M.modal({
      title: "Weekly shopping list", wide: true,
      sub: "Everything in the 7-day plan, added up. Quantities are as-purchased for the whole week.",
      body: '<div id="shopSheet">' + html + '<div class="rep-note">Buy fresh vegetables and fruit twice in the week rather than all at once.</div></div>',
      footer: [
        { label: "Copy", icon: "copy", fn: function () { M.copy(text.join("\n")).then(function () { M.toast("Shopping list copied", "ok"); }); } },
        {
          label: "Send", icon: "message", fn: function () {
            if (m.phone) window.open(M.wa(m.phone, text.join("\n")), "_blank");
            else M.copy(text.join("\n")).then(function () { M.toast("Copied — no phone on file", "ok"); });
          }
        },
        { label: "Print", cls: "primary", icon: "print", fn: function () { M.printOnly("shopSheet"); } }
      ]
    });
  }

  function meter(label, val, target, unit) {
    var pc = target ? Math.round((val / target) * 100) : 0;
    var col = pc >= 92 && pc <= 108 ? "var(--ok)" : pc >= 80 && pc <= 120 ? "var(--warn)" : "var(--no)";
    return '<div class="meter"><div class="mh"><b>' + M.esc(label) + "</b><span>" + val + " / " + target + " " + unit + "</span></div>"
      + '<div class="mt"><i style="width:' + M.clamp(pc, 0, 100) + "%;background:" + col + '"></i></div></div>';
  }
})(window);
