/* ============================================================
   Momentum · nutrition.js — calorie/macro engine + Indian meal
   plan generator (veg / eggetarian / non-veg / vegan aware,
   goal + experience-level aware)
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M, FOODS = null;

  var ACT = { sed: 1.2, light: 1.375, mod: 1.55, high: 1.725, ath: 1.9 };
  var GOAL_ADJ = {
    fatloss: { first: -.15, ret: -.15, beg: -.18, int: -.20, adv: -.22 },
    muscle: { first: .08, ret: .08, beg: .12, int: .12, adv: .08 },
    recomp: { first: 0, ret: 0, beg: -.05, int: -.05, adv: -.05 },
    strength: { first: .05, ret: .05, beg: .08, int: .08, adv: .08 },
    endurance: { first: .03, ret: .03, beg: .05, int: .05, adv: .05 },
    fitness: { first: 0, ret: 0, beg: 0, int: 0, adv: 0 }
  };
  var PRO_KG = { fatloss: 2.0, muscle: 1.9, recomp: 2.2, strength: 2.0, endurance: 1.6, fitness: 1.6 };

  /* ---------- meal frames ---------- */
  var FRAMES = {
    3: [
      { k: "b", label: "Breakfast", time: "8:00 am", share: .30 },
      { k: "l", label: "Lunch", time: "1:30 pm", share: .40 },
      { k: "d", label: "Dinner", time: "8:30 pm", share: .30 }
    ],
    4: [
      { k: "b", label: "Breakfast", time: "8:00 am", share: .26 },
      { k: "l", label: "Lunch", time: "1:30 pm", share: .32 },
      { k: "s", label: "Evening snack", time: "5:00 pm", share: .16 },
      { k: "d", label: "Dinner", time: "8:30 pm", share: .26 }
    ],
    5: [
      { k: "b", label: "Breakfast", time: "8:00 am", share: .24 },
      { k: "s", label: "Mid-morning", time: "11:00 am", share: .10 },
      { k: "l", label: "Lunch", time: "1:30 pm", share: .30 },
      { k: "post", label: "Post-workout", time: "7:00 pm", share: .12 },
      { k: "d", label: "Dinner", time: "9:00 pm", share: .24 }
    ],
    6: [
      { k: "b", label: "Breakfast", time: "7:30 am", share: .22 },
      { k: "s", label: "Mid-morning", time: "10:30 am", share: .10 },
      { k: "l", label: "Lunch", time: "1:30 pm", share: .27 },
      { k: "pre", label: "Pre-workout", time: "5:00 pm", share: .08 },
      { k: "post", label: "Post-workout", time: "7:30 pm", share: .12 },
      { k: "d", label: "Dinner", time: "9:15 pm", share: .21 }
    ]
  };

  /* ============================================================
     TARGETS  (Mifflin-St Jeor → TDEE → goal-adjusted macros)
     ============================================================ */
  function targets(m) {
    var wt = M.G ? M.G.weight(m) : m.startWeight;
    var ht = m.height || 170;
    var age = M.age(m.dob) || 28;
    var sex = m.sex === "f" ? "f" : "m";
    var lvl = m.level || "beg";
    var goal = m.goal || "fitness";

    var bmr = Math.round(10 * wt + 6.25 * ht - 5 * age + (sex === "m" ? 5 : -161));
    var af = ACT[m.activity] || 1.375;
    if ((m.daysPerWeek || 4) >= 5) af += .03;
    var tdee = Math.round(bmr * af);

    var bmi = wt / Math.pow(ht / 100, 2);
    var adj = (GOAL_ADJ[goal] || GOAL_ADJ.fitness)[lvl];
    if (adj == null) adj = 0;
    if (goal === "fatloss" && bmi >= 30) adj -= .03;
    var kcal = Math.round(tdee * (1 + adj));

    /* safety floors */
    var floor = Math.max(Math.round(bmr * 1.1), sex === "m" ? 1500 : 1200);
    var floored = false;
    if (kcal < floor) { kcal = floor; floored = true; }
    kcal = Math.round(kcal / 10) * 10;

    /* protein on an adjusted weight when clearly overweight */
    var ideal = (ht - 100) * (sex === "m" ? 1 : .95);
    var proWt = bmi > 27.5 ? Math.round((ideal + .3 * (wt - ideal)) * 10) / 10 : wt;
    var perKg = PRO_KG[goal] || 1.6;
    if (lvl === "first") perKg = Math.min(perKg, 1.6);
    if (lvl === "ret") perKg = Math.min(perKg, 1.8);
    if (lvl === "adv") perKg += .1;
    if (m.diet === "vegan") perKg += .1;
    var protein = Math.round(proWt * perKg);
    if (protein * 4 > kcal * .42) protein = Math.round((kcal * .42) / 4);

    /* fat 25% of kcal, min 0.6 g/kg */
    var fat = Math.round((kcal * .25) / 9);
    var fatMin = Math.round(wt * .6);
    if (fat < fatMin) fat = fatMin;
    var carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
    /* endurance & strength need carbs — trade fat down to ~18% if starved */
    var carbMin = (goal === "endurance" || goal === "strength") ? Math.round(wt * 3) : Math.round(wt * 1.5);
    if (carbs < carbMin) {
      var minFat = Math.max(Math.round((kcal * .18) / 9), Math.round(wt * .5));
      fat = Math.max(minFat, fat - Math.ceil(((carbMin - carbs) * 4) / 9));
      carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
    }
    if (carbs < 40) carbs = 40;

    var water = Math.round((wt * 35 + ((m.daysPerWeek || 4) >= 4 ? 700 : 500)) / 100) * 100;

    return {
      weight: wt, height: ht, age: age, sex: sex, bmi: Math.round(bmi * 10) / 10,
      bmr: bmr, tdee: tdee, kcal: kcal, protein: protein, carbs: carbs, fat: fat,
      perKg: Math.round(perKg * 100) / 100, proWt: proWt, adjPct: Math.round(adj * 100),
      floored: floored, water: water, fibre: Math.round((kcal / 1000) * 14),
      deficit: tdee - kcal
    };
  }

  /* ============================================================
     PORTIONING SOLVER
     A meal is a list of {f0: food, a: amount}. We seed it with a
     protein anchor, a carb anchor and supporting items, then nudge
     portions in single steps until the calories land on target.
     ============================================================ */
  function kcalPerUnit(f) { return f.kcal / f.bq; }
  function minKcal(f) { return kcalPerUnit(f) * f.mn; }

  function amountFor(food, key, need) {
    var per = food[key] / food.bq;
    if (!per) return food.mn;
    var q = Math.round((need / per) / food.st) * food.st;
    return M.clamp(Math.round(q * 100) / 100, food.mn, food.mx);
  }
  function capKcal(food, amount, maxKcal) {
    var per = kcalPerUnit(food);
    if (!per) return amount;
    var q = Math.floor((maxKcal / per) / food.st) * food.st;
    return M.clamp(Math.min(amount, Math.max(food.mn, q)), food.mn, food.mx);
  }
  /* pick a food whose smallest sensible portion still fits the calorie room */
  function choose(pool, room, rnd, used) {
    if (!pool || !pool.length) return null;
    var fresh = pool.filter(function (f) { return used.indexOf(f.n) < 0; });
    var use = fresh.length ? fresh : pool;
    var fit = use.filter(function (f) { return minKcal(f) <= room; });
    if (fit.length) return fit[Math.floor(rnd() * fit.length)];
    return use.slice().sort(function (a, b) { return minKcal(a) - minKcal(b); })[0];
  }
  function sumOf(sel) {
    var t = { kcal: 0, p: 0, c: 0, f: 0 };
    sel.forEach(function (s) {
      var k = s.a / s.f0.bq;
      t.kcal += s.f0.kcal * k; t.p += s.f0.p * k; t.c += s.f0.c * k; t.f += s.f0.f * k;
    });
    return t;
  }
  function toItems(sel) {
    return sel.map(function (s) {
      var mac = FOODS.macro(s.f0, s.a);
      return {
        name: s.f0.n, qty: FOODS.qty(s.f0, s.a), amount: s.a, unit: s.f0.bu,
        kcal: Math.round(mac.kcal), p: Math.round(mac.p * 10) / 10,
        c: Math.round(mac.c * 10) / 10, f: Math.round(mac.f * 10) / 10
      };
    });
  }
  function tot(items) {
    return {
      kcal: Math.round(M.sum(items, function (i) { return i.kcal; })),
      p: Math.round(M.sum(items, function (i) { return i.p; })),
      c: Math.round(M.sum(items, function (i) { return i.c; })),
      f: Math.round(M.sum(items, function (i) { return i.f; }))
    };
  }

  /* order in which portions are trimmed / grown */
  var DOWN_ORDER = ["x", "f", "fr", "c", "v", "d", "p"];
  var UP_ORDER = ["c", "f", "p", "fr", "x"];

  function balance(sel, targetKcal, tol, keepProtein, upRoles) {
    var guard = 0;
    while (guard++ < 120) {
      var t = sumOf(sel);
      var diff = t.kcal - targetKcal;
      if (Math.abs(diff) <= targetKcal * tol) break;
      var moved = false, i, j;
      if (diff > 0) {
        for (i = 0; i < DOWN_ORDER.length && !moved; i++) {
          for (j = sel.length - 1; j >= 0; j--) {
            var s = sel[j];
            if (s.f0.r !== DOWN_ORDER[i]) continue;
            if (s.a - s.f0.st < s.f0.mn - 1e-9) continue;
            if (s.f0.r === "p" && keepProtein != null) {
              var afterP = t.p - (s.f0.p / s.f0.bq) * s.f0.st;
              if (afterP < keepProtein) continue;
            }
            s.a = Math.round((s.a - s.f0.st) * 100) / 100;
            moved = true;
            break;
          }
        }
        if (!moved && sel.length > 2) {
          /* nothing can shrink further — drop the least essential item
             (protein, carbs and vegetables always stay on the plate) */
          for (i = 0; i < DOWN_ORDER.length && !moved; i++) {
            if (DOWN_ORDER[i] === "p" || DOWN_ORDER[i] === "c" || DOWN_ORDER[i] === "v") continue;
            for (j = sel.length - 1; j >= 0; j--) {
              if (sel[j].f0.r !== DOWN_ORDER[i]) continue;
              sel.splice(j, 1); moved = true; break;
            }
          }
        }
      } else {
        var ups = upRoles || UP_ORDER;
        for (i = 0; i < ups.length && !moved; i++) {
          for (j = 0; j < sel.length; j++) {
            var u = sel[j];
            if (u.f0.r !== ups[i]) continue;
            if (u.a + u.f0.st > u.f0.mx + 1e-9) continue;
            u.a = Math.round((u.a + u.f0.st) * 100) / 100;
            moved = true;
            break;
          }
        }
      }
      if (!moved) break;
    }
    return sel;
  }

  function buildMeal(frame, T, m, rnd, used) {
    FOODS = M.FOODS;
    var diet = m.diet || "veg", alg = m.allergies || [];
    var need = {
      kcal: T.kcal * frame.share, p: T.protein * frame.share,
      c: T.carbs * frame.share, f: T.fat * frame.share
    };
    var key = frame.k;
    var P = FOODS.pool(diet, alg, "p", key), C = FOODS.pool(diet, alg, "c", key);
    /* powders are for the shake window (or the protein rescue), not for anchoring a normal meal */
    if (key !== "post" && key !== "pre") {
      var whole = P.filter(function (f) { return f.tags.indexOf("supp") < 0; });
      if (whole.length) P = whole;
    }
    var V = FOODS.pool(diet, alg, "v", key), Fa = FOODS.pool(diet, alg, "f", key);
    var FR = FOODS.pool(diet, alg, "fr", key), D = FOODS.pool(diet, alg, "d", key);
    var sel = [], got, room;

    /* ---- pre-workout: quick carb (+ a drink if there is room) ---- */
    if (key === "pre") {
      var pc = choose(FR.concat(C), need.kcal, rnd, used);
      if (pc) sel.push({ f0: pc, a: capKcal(pc, amountFor(pc, "c", need.c), need.kcal) });
      var dr = D[0];
      if (dr && sumOf(sel).kcal + minKcal(dr) < need.kcal * 1.15) sel.push({ f0: dr, a: dr.bq });
      balance(sel, need.kcal, .18);
      var pit = toItems(sel);
      return { key: key, label: frame.label, time: frame.time, items: pit, totals: tot(pit), target: need, sel: sel };
    }

    /* ---- 1. protein anchor ----
       When protein is hard to hit (a deficit, or a plant-based diet) bias the
       pick toward the most protein-dense half of the available foods. */
    var pPool = P;
    var tight = m.goal === "fatloss" || m.goal === "recomp" || diet === "veg" || diet === "vegan";
    if (tight && P.length > 2) {
      pPool = P.slice().sort(function (a, b) { return (a.kcal / a.p) - (b.kcal / b.p); })
        .slice(0, Math.max(2, Math.ceil(P.length * .55)));
    }
    var share = tight ? .82 : .72;
    var pf = choose(pPool, need.kcal * .78, rnd, used);
    if (pf) {
      sel.push({ f0: pf, a: capKcal(pf, amountFor(pf, "p", need.p * (key === "s" ? .9 : share)), need.kcal * .78) });
      used.push(pf.n);
    }
    /* a second protein source when badly short and there is calorie room */
    got = sumOf(sel);
    if (pf && got.p < need.p * .6 && got.kcal < need.kcal * .6) {
      var pf2 = choose(P, need.kcal - got.kcal, rnd, used);
      if (pf2 && pf2.n !== pf.n) {
        sel.push({ f0: pf2, a: capKcal(pf2, amountFor(pf2, "p", need.p - got.p), need.kcal * .45) });
        used.push(pf2.n);
      }
    }
    /* ---- 2. carb anchor fills the remaining carbs ---- */
    got = sumOf(sel);
    room = need.kcal - got.kcal;
    if (room > 45 && C.length) {
      var cf = choose(C, room, rnd, used);
      if (cf) {
        sel.push({ f0: cf, a: capKcal(cf, amountFor(cf, "c", Math.max(0, need.c - got.c)), room * 1.05) });
        used.push(cf.n);
      }
    }
    /* ---- 3. vegetables on the main meals ---- */
    got = sumOf(sel);
    room = need.kcal - got.kcal;
    if ((key === "l" || key === "d") && V.length && room > 55) {
      var vf = choose(V, room, rnd, used);
      if (vf) { sel.push({ f0: vf, a: capKcal(vf, vf.bq, room) }); used.push(vf.n); }
    }
    /* ---- 4. fruit on breakfast / snacks ---- */
    got = sumOf(sel);
    room = need.kcal - got.kcal;
    if ((key === "b" || key === "s") && FR.length && room > 65 && rnd() < .85) {
      var fr = choose(FR, room, rnd, used);
      if (fr) { sel.push({ f0: fr, a: capKcal(fr, fr.bq, room) }); used.push(fr.n); }
    }
    /* ---- 5. fats close the fat gap ---- */
    got = sumOf(sel);
    room = need.kcal - got.kcal;
    if (Fa.length && need.f - got.f > 3.5 && room > 40) {
      var ff = choose(Fa, room, rnd, used);
      if (ff) { sel.push({ f0: ff, a: capKcal(ff, amountFor(ff, "f", need.f - got.f), room) }); used.push(ff.n); }
    }
    /* ---- 6. land on the calorie target, protecting the protein ---- */
    balance(sel, need.kcal, .07, need.p * .55);
    var items = toItems(sel);
    return { key: key, label: frame.label, time: frame.time, items: items, totals: tot(items), target: need, sel: sel };
  }

  /* if the day is short on protein, add the leanest source available and rebalance */
  function proteinRescue(m, T, meals) {
    var diet = m.diet || "veg", alg = m.allergies || [], guard = 0;
    function dayAll() {
      var all = [];
      meals.forEach(function (ml) { all = all.concat(ml.items); });
      return tot(all);
    }
    function dayP() { return dayAll().p; }
    function dayK() { return dayAll().kcal; }
    var totP = dayP();
    var lean = FOODS.pool(diet, alg, "p", null).filter(function (f) { return f.p > 0; })
      .sort(function (a, b) { return (a.kcal / a.p) - (b.kcal / b.p); });
    while (totP < T.protein * .92 && guard++ < 9 && lean.length) {
      var f0 = lean[(guard - 1) % Math.min(3, lean.length)];
      var amount = amountFor(f0, "p", T.protein - totP);
      var host = meals.filter(function (ml) { return !!ml.sel && ml.key !== "pre"; })
        .sort(function (a, b) { return (b.target.kcal - b.totals.kcal) - (a.target.kcal - a.totals.kcal); })[0];
      if (!host) break;
      var snapshot = host.sel.map(function (s) { return { f0: s.f0, a: s.a }; });
      host.sel.push({ f0: f0, a: amount });
      /* protect the protein just added — balance trims carbs/fats to make room */
      var floorP = sumOf(host.sel).p * .95;
      balance(host.sel, host.target.kcal, .05, floorP);
      host.items = toItems(host.sel);
      host.totals = tot(host.items);
      var next = dayP();
      if (next <= totP + .5) {
        host.sel = snapshot;
        host.items = toItems(host.sel);
        host.totals = tot(host.items);
        break;
      }
      totP = next;
    }
    return meals;
  }

  /* pull protein back under a sensible ceiling and top the fat back up,
     so a plan does not read as 45% over on protein and short on fats */
  function refineMacros(m, T, meals) {
    function flat() {
      var a = [];
      meals.forEach(function (ml) { if (ml.sel) ml.sel.forEach(function (s) { a.push({ s: s, ml: ml }); }); });
      return a;
    }
    function live() {
      var t = { kcal: 0, p: 0, c: 0, f: 0 };
      flat().forEach(function (x) {
        var k = x.s.a / x.s.f0.bq;
        t.kcal += x.s.f0.kcal * k; t.p += x.s.f0.p * k; t.c += x.s.f0.c * k; t.f += x.s.f0.f * k;
      });
      return t;
    }
    function refresh() {
      meals.forEach(function (ml) { if (ml.sel) { ml.items = toItems(ml.sel); ml.totals = tot(ml.items); } });
    }
    var guard = 0, t;
    /* protein ceiling — never trim below the target itself */
    while (guard++ < 60) {
      t = live();
      if (t.p <= T.protein * 1.12) break;
      var cands = flat().filter(function (x) {
        return x.s.f0.r === "p" && x.s.a - x.s.f0.st >= x.s.f0.mn - 1e-9;
      }).sort(function (a, b) {
        return (b.s.f0.p / b.s.f0.bq) * b.s.a - (a.s.f0.p / a.s.f0.bq) * a.s.a;
      });
      if (!cands.length) break;
      var c = cands[0];
      if (t.p - (c.s.f0.p / c.s.f0.bq) * c.s.f0.st < T.protein) break;
      c.s.a = Math.round((c.s.a - c.s.f0.st) * 100) / 100;
    }
    /* calorie-neutral swap: too much protein while carbs are short */
    guard = 0;
    while (guard++ < 40) {
      t = live();
      if (t.p <= T.protein * 1.10 || t.c >= T.carbs * .97) break;
      var pc = flat().filter(function (x) {
        return x.s.f0.r === "p" && x.s.a - x.s.f0.st >= x.s.f0.mn - 1e-9
          && t.p - (x.s.f0.p / x.s.f0.bq) * x.s.f0.st >= T.protein;
      }).sort(function (a, b) {
        return (b.s.f0.p / b.s.f0.bq) * b.s.a - (a.s.f0.p / a.s.f0.bq) * a.s.a;
      })[0];
      if (!pc) break;
      var freed = (pc.s.f0.kcal / pc.s.f0.bq) * pc.s.f0.st;
      pc.s.a = Math.round((pc.s.a - pc.s.f0.st) * 100) / 100;
      /* put the calories back as carbs */
      var spent = 0, tries = 0;
      while (spent < freed * .9 && tries++ < 10) {
        var cc = flat().filter(function (x) {
          return x.s.f0.r === "c" && x.s.a + x.s.f0.st <= x.s.f0.mx + 1e-9;
        }).sort(function (a, b) {
          return (a.s.f0.kcal / a.s.f0.bq) * a.s.f0.st - (b.s.f0.kcal / b.s.f0.bq) * b.s.f0.st;
        })[0];
        if (!cc) break;
        cc.s.a = Math.round((cc.s.a + cc.s.f0.st) * 100) / 100;
        spent += (cc.s.f0.kcal / cc.s.f0.bq) * cc.s.f0.st;
      }
    }
    /* fat ceiling — trim added fats before they distort the split */
    guard = 0;
    while (guard++ < 40) {
      t = live();
      if (t.f <= T.fat * 1.15) break;
      var fcut = flat().filter(function (x) {
        return (x.s.f0.r === "f" || x.s.f0.r === "x") && x.s.a - x.s.f0.st >= x.s.f0.mn - 1e-9;
      }).sort(function (a, b) {
        return (b.s.f0.f / b.s.f0.bq) * b.s.a - (a.s.f0.f / a.s.f0.bq) * a.s.a;
      })[0];
      if (!fcut) break;
      fcut.s.a = Math.round((fcut.s.a - fcut.s.f0.st) * 100) / 100;
    }
    /* fat floor */
    guard = 0;
    while (guard++ < 40) {
      t = live();
      if (t.f >= T.fat * .85 || t.kcal > T.kcal * 1.02) break;
      var grow = flat().filter(function (x) { return x.s.f0.r === "f" && x.s.a + x.s.f0.st <= x.s.f0.mx + 1e-9; })[0];
      if (grow) { grow.s.a = Math.round((grow.s.a + grow.s.f0.st) * 100) / 100; continue; }
      var pool = FOODS.pool(m.diet || "veg", m.allergies || [], "f", null);
      if (!pool.length) break;
      refresh();
      var host = meals.filter(function (ml) { return !!ml.sel && ml.key !== "pre"; })
        .sort(function (a, b) { return (b.target.kcal - b.totals.kcal) - (a.target.kcal - a.totals.kcal); })[0];
      if (!host) break;
      host.sel.push({ f0: pool[Math.floor(pool.length / 2)], a: pool[Math.floor(pool.length / 2)].mn });
      refresh();
    }
    refresh();
    return meals;
  }

  /* every portion is at its cap and the day is still short — add one more
     practical item to whichever meal will take it */
  function addFiller(m, T, meals, room) {
    var diet = m.diet || "veg", alg = m.allergies || [];
    var hosts = meals.filter(function (ml) { return !!ml.sel && ml.key !== "pre"; })
      .sort(function (a, b) { return (a.totals.kcal - a.target.kcal) - (b.totals.kcal - b.target.kcal); });
    var i, j, roles = ["c", "f", "p", "fr"];
    for (i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      for (j = 0; j < roles.length; j++) {
        var pool = FOODS.pool(diet, alg, roles[j], host.key);
        if (!pool.length) pool = FOODS.pool(diet, alg, roles[j], null);
        pool = pool.filter(function (f) {
          if (f.tags.indexOf("supp") >= 0) return false;
          return !host.sel.some(function (s) { return s.f0.n === f.n; });
        });
        if (!pool.length) continue;
        var pick = pool[0];
        host.sel.push({ f0: pick, a: capKcal(pick, pick.mx, Math.max(60, room)) });
        host.items = toItems(host.sel);
        host.totals = tot(host.items);
        return true;
      }
    }
    return false;
  }

  function buildDay(m, T, dayIdx, seed) {
    FOODS = M.FOODS;
    var frames = FRAMES[M.clamp(m.meals || 4, 3, 6)] || FRAMES[4];
    var rnd = M.rng(seed + "|" + dayIdx);
    var used = [];
    var meals = frames.map(function (f) { return buildMeal(f, T, m, rnd, used); });
    proteinRescue(m, T, meals);
    refineMacros(m, T, meals);

    /* day-level calorie trim / top-up across meals */
    function dayTot() {
      var all = [];
      meals.forEach(function (ml) { all = all.concat(ml.items); });
      return tot(all);
    }
    /* snapshot / restore so a coarse step can never make the day worse */
    function snap() {
      return meals.map(function (ml) {
        return ml.sel ? ml.sel.map(function (s) { return { f0: s.f0, a: s.a }; }) : null;
      });
    }
    function restore(sn) {
      meals.forEach(function (ml, i) {
        if (!sn[i]) return;
        ml.sel = sn[i]; ml.items = toItems(ml.sel); ml.totals = tot(ml.items);
      });
    }
    var dt = dayTot(), guard = 0;
    while (Math.abs(dt.kcal - T.kcal) > T.kcal * .04 && guard++ < 24) {
      var gap = dt.kcal - T.kcal;          /* >0 = over target */
      var over = gap > 0;
      var hosts = meals.filter(function (ml) { return !!ml.sel; }).sort(function (a, b) {
        return over ? (b.totals.kcal - b.target.kcal) - (a.totals.kcal - a.target.kcal)
          : (a.totals.kcal - a.target.kcal) - (b.totals.kcal - b.target.kcal);
      });
      var moved = false, hi;
      for (hi = 0; hi < hosts.length && !moved; hi++) {
        var host = hosts[hi];
        /* never distort a single meal beyond a sane share of its own target */
        var want = M.clamp(host.target.kcal - gap, host.target.kcal * .72, host.target.kcal * 1.3);
        var sn = snap(), devBefore = Math.abs(gap), beforeK = host.totals.kcal;
        var ups = null;
        if (!over && dt.c < T.carbs * .97) ups = ["c", "fr", "p", "f"];
        balance(host.sel, Math.max(90, want), .04, host.totals.p * .92, ups);
        host.items = toItems(host.sel);
        host.totals = tot(host.items);
        var dt2 = dayTot();
        if (host.totals.kcal !== beforeK && Math.abs(dt2.kcal - T.kcal) < devBefore) {
          dt = dt2; moved = true;
        } else {
          restore(sn);
        }
      }
      if (moved) continue;
      /* everything is at a cap — add one more practical item, if that helps */
      if (!over) {
        var sn2 = snap(), dev2 = Math.abs(dt.kcal - T.kcal);
        if (addFiller(m, T, meals, T.kcal - dt.kcal)) {
          var dt3 = dayTot();
          if (Math.abs(dt3.kcal - T.kcal) < dev2) { dt = dt3; continue; }
          restore(sn2);
        }
      }
      break;
    }
    /* second pass: pull the macro split back, then re-close the calories */
    refineMacros(m, T, meals);
    dt = dayTot(); guard = 0;
    while (Math.abs(dt.kcal - T.kcal) > T.kcal * .04 && guard++ < 12) {
      var gap2 = dt.kcal - T.kcal, over2 = gap2 > 0, moved2 = false, hj;
      var hosts2 = meals.filter(function (ml) { return !!ml.sel; }).sort(function (a, b) {
        return over2 ? (b.totals.kcal - b.target.kcal) - (a.totals.kcal - a.target.kcal)
          : (a.totals.kcal - a.target.kcal) - (b.totals.kcal - b.target.kcal);
      });
      for (hj = 0; hj < hosts2.length && !moved2; hj++) {
        var h2 = hosts2[hj];
        var want2 = M.clamp(h2.target.kcal - gap2, h2.target.kcal * .72, h2.target.kcal * 1.3);
        var sn3 = snap(), dev3 = Math.abs(gap2), bk = h2.totals.kcal;
        balance(h2.sel, Math.max(90, want2), .04, h2.totals.p * .92, over2 ? null : ["c", "fr", "p", "f"]);
        h2.items = toItems(h2.sel); h2.totals = tot(h2.items);
        var dt4 = dayTot();
        if (h2.totals.kcal !== bk && Math.abs(dt4.kcal - T.kcal) < dev3) { dt = dt4; moved2 = true; }
        else restore(sn3);
      }
      if (!moved2) break;
    }
    meals.forEach(function (ml) { delete ml.sel; });
    return { idx: dayIdx, label: M.DOW[(dayIdx + 1) % 7], meals: meals, totals: dayTot() };
  }

  /* ============================================================
     COACHING CONTENT
     ============================================================ */
  function supplements(m, T, dayTotals) {
    var out = [];
    var shortP = T.protein - (dayTotals ? dayTotals.p : T.protein);
    if (shortP > 12 || m.diet === "vegan" || m.diet === "veg") {
      out.push({ n: "Whey / plant protein", d: "1 scoop (24-27 g protein) on training days if the day’s protein target is missed from food alone.", opt: true });
    }
    if (m.goal === "muscle" || m.goal === "strength" || m.goal === "recomp") {
      out.push({ n: "Creatine monohydrate", d: "3-5 g daily, any time, with water. The most evidence-backed strength supplement there is.", opt: true });
    }
    if (m.diet === "veg" || m.diet === "vegan") {
      out.push({ n: "Vitamin B12", d: "Plant-based diets run low on B12. Standard adult dose, or as advised by a physician.", opt: false });
      out.push({ n: "Omega-3", d: "1 tbsp ground flax is already in the plan; consider algal DHA if fish is avoided entirely.", opt: true });
    }
    out.push({ n: "Vitamin D3", d: "Very common deficiency among Indian gym-goers — test before dosing.", opt: true });
    if (m.level === "first") {
      out.push({ n: "Nothing else yet", d: "Food, sleep and consistent training beat any supplement stack in the first three months.", opt: false });
    }
    return out;
  }

  function coaching(m, T) {
    var n = [];
    if (m.level === "first") {
      n.push("First 2-3 weeks are a technique block: leave 2-3 reps in the tank on every set and learn the movement before adding load.");
      n.push("Expect soreness (DOMS) for the first two weeks. It settles — reduce the load, do not stop training.");
    }
    if (m.level === "ret") {
      n.push("Returning after a break: start at roughly 60% of your old loads and add 5% a week. Tendons adapt slower than muscle.");
      n.push("Prioritise warm-ups and mobility for the first month — comeback injuries happen in week 2-3, not week 1.");
    }
    if (m.goal === "fatloss") {
      n.push("Target rate: 0.5-0.75% of bodyweight a week (about " + M.n1(T.weight * .005) + "-" + M.n1(T.weight * .0075) + " kg). Faster than that and muscle goes with the fat.");
      n.push("Walk 8,000-10,000 steps on top of training. Steps, not extra cardio sessions, keep the deficit sustainable.");
    }
    if (m.goal === "muscle") {
      n.push("Weigh in on three mornings a week and average it. Gaining more than 0.5% bodyweight a week means the surplus is too big — cut 150 kcal.");
      n.push("Progressive overload is the real driver: add 2.5 kg or 1 rep whenever you hit the top of the rep range twice in a row.");
    }
    if (m.goal === "recomp") n.push("Recomposition is slow by design — the scale barely moves while measurements and lifts change. Track waist and photos, not just weight.");
    if (m.goal === "strength") n.push("Keep the big lifts fresh: warm up thoroughly, take full rest (2-3 min) on compounds, never grind a rep with breaking form.");
    if (m.goal === "endurance") n.push("Keep two lifting sessions a week even in an endurance block — strength work protects the joints over long mileage.");
    if (m.diet === "veg" || m.diet === "vegan") n.push("Vegetarian protein works when sources are combined — dal with rice, curd with roti, sattu with milk — that pairing completes the amino acid profile.");
    if (T.floored) n.push("Calories were raised to a safe floor: a deeper cut would sit below this client’s metabolic baseline. Add activity instead of cutting food further.");
    if (T.bmi >= 30) n.push("BMI is in the obese range — keep impact low at the start (walking, cycling, machines) and re-check joints every few weeks.");
    if (T.bmi < 18.5) n.push("BMI is underweight — the priority is a consistent surplus: liquid calories (milk, shakes) are easier than more solid food.");
    if (m.medical) n.push("Medical note on file: " + m.medical + " — clear the programme with a physician where relevant.");
    n.push("Sleep 7-8 hours. Under six hours measurably reduces strength progress and raises hunger — it is part of the programme, not a bonus.");
    return n;
  }

  /* honest note when whole foods cannot reach the protein target */
  function planNotes(m, T, avg) {
    var out = [];
    if (avg.p < T.protein * .92) {
      out.push("Whole food in this plan reaches about " + avg.p + " g protein against a " + T.protein
        + " g target — the gap is normal on a " + (M.LBL.diet[m.diet] || m.diet).toLowerCase()
        + " plan at these calories. One scoop of protein powder closes it, or add " + Math.max(1, Math.round((T.protein - avg.p) / 8))
        + " more portions of the protein column across the week.");
    }
    if (avg.kcal > T.kcal * 1.05) out.push("The generated day sits slightly above target because minimum practical portions do not divide any finer — trim the carb portion at dinner if weight stalls.");
    return out;
  }

  /* ============================================================
     PLAN
     ============================================================ */
  function plan(m, opts) {
    opts = opts || {};
    FOODS = M.FOODS;
    var T = opts.targets || targets(m);
    var seed = opts.seed || (m.id + "|" + m.goal + "|" + m.diet + "|" + m.meals + "|" + Math.round(T.kcal));
    var days = [], i, n = opts.days || 7;
    for (i = 0; i < n; i++) days.push(buildDay(m, T, i, seed));
    var avg = {
      kcal: Math.round(M.sum(days, function (d) { return d.totals.kcal; }) / days.length),
      p: Math.round(M.sum(days, function (d) { return d.totals.p; }) / days.length),
      c: Math.round(M.sum(days, function (d) { return d.totals.c; }) / days.length),
      f: Math.round(M.sum(days, function (d) { return d.totals.f; }) / days.length)
    };
    return {
      created: M.today(), memberId: m.id, memberName: m.name,
      targets: T, days: days, avg: avg, seed: seed,
      supplements: supplements(m, T, avg), notes: planNotes(m, T, avg).concat(coaching(m, T)),
      hydration: T.water, fibre: T.fibre,
      rules: [
        "Weigh food raw / uncooked where a gram weight is given; one katori = a standard 150 ml bowl.",
        "Swap freely inside a column — any protein for another protein, any carb for another carb of the same size.",
        "The protein number is the non-negotiable one; carbs and fats can move around the day to suit your schedule.",
        "Two meals out a week are fine on this plan — pick the protein first, then the carb, and skip the sugary drink."
      ]
    };
  }

  /* ---------- plain-text export (WhatsApp friendly) ---------- */
  function text(pl, m) {
    var L = M.LBL, T = pl.targets, out = [];
    out.push("*" + (m.name || "Client") + " — Diet Plan*");
    out.push(M.fmtD(pl.created, "long"));
    out.push("");
    out.push("Goal: " + L.goal[m.goal] + "  |  Level: " + L.level[m.level] + "  |  Diet: " + L.diet[m.diet]);
    out.push("Weight " + M.n1(T.weight) + " kg  |  Height " + T.height + " cm  |  BMI " + T.bmi);
    out.push("");
    out.push("*Daily targets*");
    out.push("Calories: " + T.kcal + " kcal (maintenance " + T.tdee + ")");
    out.push("Protein: " + T.protein + " g  |  Carbs: " + T.carbs + " g  |  Fat: " + T.fat + " g");
    out.push("Water: " + (T.water / 1000).toFixed(1) + " L  |  Fibre: " + T.fibre + " g");
    out.push("");
    pl.days.slice(0, 1).forEach(function (d) {
      out.push("*Day template*");
      d.meals.forEach(function (ml) {
        out.push("");
        out.push("_" + ml.label + " (" + ml.time + ") — " + ml.totals.kcal + " kcal, " + ml.totals.p + " g protein_");
        ml.items.forEach(function (it) { out.push("• " + it.name + " — " + it.qty); });
      });
    });
    out.push("");
    out.push("*Coach notes*");
    pl.notes.slice(0, 5).forEach(function (x) { out.push("• " + x); });
    out.push("");
    out.push("— " + (M.store.gym.profile.name || "Momentum") + (M.store.gym.profile.trainer ? " · " + M.store.gym.profile.trainer : ""));
    return out.join("\n");
  }

  function csv(pl) {
    var rows = [["day", "meal", "time", "item", "quantity", "kcal", "protein_g", "carbs_g", "fat_g"]];
    pl.days.forEach(function (d, di) {
      d.meals.forEach(function (ml) {
        ml.items.forEach(function (it) {
          rows.push(["Day " + (di + 1), ml.label, ml.time, it.name, it.qty, it.kcal, it.p, it.c, it.f]);
        });
      });
    });
    return rows.map(function (r) { return r.map(M.csvCell).join(","); }).join("\n");
  }

  M.NUT = {
    ACT: ACT, FRAMES: FRAMES, targets: targets, plan: plan, text: text, csv: csv,
    buildDay: buildDay, supplements: supplements, coaching: coaching
  };
})(window);
