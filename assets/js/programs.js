/* ============================================================
   Momentum · programs.js — training split + workout generator
   (days/week × level × goal aware, mapped to the exercise DB)
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M;

  var SPLITS = {
    2: { first: ["full", "full"], ret: ["full", "full"], beg: ["full", "full"], int: ["upper", "lower"], adv: ["upper", "lower"] },
    3: { first: ["full", "full", "full"], ret: ["full", "full", "full"], beg: ["full", "full", "full"], int: ["push", "pull", "legs"], adv: ["push", "pull", "legs"] },
    4: { first: ["upper", "lower", "upper", "lower"], ret: ["upper", "lower", "upper", "lower"], beg: ["upper", "lower", "upper", "lower"], int: ["push", "pull", "legs", "upper"], adv: ["push", "pull", "legs", "upper"] },
    5: { first: ["upper", "lower", "full", "upper", "lower"], ret: ["upper", "lower", "full", "upper", "lower"], beg: ["push", "pull", "legs", "upper", "lower"], int: ["push", "pull", "legs", "upper", "lower"], adv: ["push", "pull", "legs", "chestback", "armsshoulders"] },
    6: { first: ["upper", "lower", "full", "upper", "lower", "cardio"], ret: ["upper", "lower", "full", "upper", "lower", "cardio"], beg: ["push", "pull", "legs", "push", "pull", "legs"], int: ["push", "pull", "legs", "push", "pull", "legs"], adv: ["push", "pull", "legs", "push", "pull", "legs"] }
  };
  var WEEKDAYS = {
    2: ["Mon", "Thu"], 3: ["Mon", "Wed", "Fri"], 4: ["Mon", "Tue", "Thu", "Fri"],
    5: ["Mon", "Tue", "Wed", "Thu", "Fri"], 6: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };
  var SCHEME = {
    strength: { comp: { s: 4, r: "4-6", rest: "2-3 min" }, acc: { s: 3, r: "8-10", rest: "90 s" }, core: { s: 3, r: "8-12", rest: "60 s" } },
    muscle: { comp: { s: 4, r: "6-10", rest: "90-120 s" }, acc: { s: 3, r: "10-12", rest: "60-75 s" }, core: { s: 3, r: "12-15", rest: "45 s" } },
    recomp: { comp: { s: 3, r: "8-10", rest: "90 s" }, acc: { s: 3, r: "10-12", rest: "60 s" }, core: { s: 3, r: "15", rest: "45 s" } },
    fatloss: { comp: { s: 3, r: "10-12", rest: "60 s" }, acc: { s: 3, r: "12-15", rest: "45 s" }, core: { s: 3, r: "15-20", rest: "30 s" } },
    endurance: { comp: { s: 3, r: "15", rest: "45 s" }, acc: { s: 2, r: "15-20", rest: "30-45 s" }, core: { s: 3, r: "20", rest: "30 s" } },
    fitness: { comp: { s: 3, r: "8-12", rest: "75-90 s" }, acc: { s: 3, r: "10-12", rest: "60 s" }, core: { s: 3, r: "15", rest: "45 s" } }
  };
  var COUNT = { first: 4, ret: 4, beg: 5, int: 6, adv: 7 };

  function build(m, opts) {
    opts = opts || {};
    var days = M.clamp(m.daysPerWeek || 4, 2, 6);
    var lvl = m.level || "beg";
    var goal = m.goal || "fitness";
    var sc = SCHEME[goal] || SCHEME.fitness;
    var splitList = (SPLITS[days] || SPLITS[4])[lvl] || (SPLITS[days] || SPLITS[4]).beg;
    var wd = WEEKDAYS[days] || WEEKDAYS[4];
    var rnd = M.rng(opts.seed || (m.id + "|" + goal + "|" + lvl + "|" + days));
    var nEx = COUNT[lvl] || 5;
    if (goal === "fatloss") nEx = Math.max(4, nEx - 1);

    var out = splitList.map(function (sp, i) {
      var pool = M.EXDB.forSplit(sp, lvl);
      var picked = [], names = {};
      /* keep 2 compounds first, then spread accessories across muscles */
      var comps = pool.filter(function (e) { return M.EXDB.isCompound(e.n); });
      var accs = pool.filter(function (e) { return !M.EXDB.isCompound(e.n); });
      var wantComp = sp === "cardio" ? 0 : lvl === "first" ? 1 : 2;
      M.pickN(comps.slice(0, Math.max(4, wantComp * 3)), wantComp, rnd).forEach(function (e) { if (!names[e.n]) { picked.push(e); names[e.n] = 1; } });
      var seenMuscle = {};
      picked.forEach(function (e) { seenMuscle[e.m] = 1; });
      var rest = accs.concat(comps).filter(function (e) { return !names[e.n]; });
      /* prefer unseen muscles for balance */
      rest.sort(function (a, b) { return (seenMuscle[a.m] ? 1 : 0) - (seenMuscle[b.m] ? 1 : 0); });
      var k = 0;
      while (picked.length < nEx && k < rest.length) {
        var e = rest[k++];
        if (names[e.n]) continue;
        picked.push(e); names[e.n] = 1; seenMuscle[e.m] = 1;
      }
      /* core finisher on non-core days */
      if (sp !== "cardio" && sp !== "core") {
        var core = M.pickN(M.EXDB.forSplit("core", lvl), 1, rnd)[0];
        if (core && !names[core.n]) picked.push(core);
      }
      return {
        day: wd[i], name: M.LBL.split[sp] || sp, split: sp,
        warmup: sp === "cardio" ? "5 min easy pace + joint circles" : "5 min cycle/treadmill + " + (sp === "legs" || sp === "lower" || sp === "full" ? "hip & ankle mobility" : "band shoulder dislocates + cat-cow"),
        ex: picked.map(function (e) {
          var isCore = M.EXDB.MUSCLES[e.m] && M.EXDB.MUSCLES[e.m].grp === "core";
          var kind = isCore ? sc.core : M.EXDB.isCompound(e.n) ? sc.comp : sc.acc;
          return {
            name: e.n, muscle: e.m, eq: e.eq,
            sets: kind.s, reps: e.m === "cardio" ? "10-15 min" : kind.r, rest: kind.rest,
            note: lvl === "first" && M.EXDB.isCompound(e.n) ? "Technique first — stay 3 reps short of failure" : ""
          };
        }),
        finisher: goal === "fatloss" ? "10-15 min incline walk or cycle, conversational pace"
          : goal === "endurance" ? "15-20 min steady cardio"
            : sp === "cardio" ? "20-30 min zone-2 cardio" : (lvl === "first" ? "5 min easy cardio + stretch" : "")
      };
    });

    var notes = [];
    notes.push("Progression rule: when you hit the top of the rep range on the last set for two sessions in a row, add 2.5 kg (upper body 1.25-2.5 kg, lower body 2.5-5 kg).");
    if (lvl === "first") notes.push("Weeks 1-3: keep every set 2-3 reps short of failure. Learning the pattern beats chasing weight.");
    if (lvl === "ret") notes.push("Week 1 at 60% of old loads, week 2 at 70%, week 3 at 80%. Re-test only in week 4.");
    if (lvl === "adv") notes.push("Take a deload every 6-8 weeks: same exercises, 60% load, half the sets.");
    else notes.push("Take an easy week every 8 weeks: same sessions, drop one set and 20% load.");
    if (goal === "fatloss") notes.push("Keep the loads heavy even in a deficit — reps and calories drop the fat, load is what keeps the muscle.");
    if (goal === "muscle") notes.push("Log every set. If the numbers in the log are not moving month over month, the programme is not working — the plan is not the problem, the load is.");
    if (m.medical) notes.push("Medical flag: " + m.medical + ". Substitute any painful movement for a pain-free variation of the same pattern.");
    notes.push("Rest days are not off days: 20-30 min walk, water, sleep. That is where the adaptation actually happens.");

    return {
      id: M.uid("pr"), created: M.today(), name: (M.LBL.level[lvl] || "") + " · " + days + " day " + splitTitle(splitList),
      daysPerWeek: days, level: lvl, goal: goal, days: out, notes: notes,
      cardio: goal === "fatloss" ? "3-4 × 20-30 min zone-2 (brisk walk / cycle) + 8-10k steps daily"
        : goal === "endurance" ? "4-5 × 30-45 min, one long session at the weekend"
          : "2 × 20 min zone-2 or 8k steps daily for heart health"
    };
  }
  function splitTitle(list) {
    var u = {}; list.forEach(function (s) { u[s] = 1; });
    var keys = Object.keys(u);
    if (keys.length === 1) return M.LBL.split[keys[0]];
    if (keys.join() === "push,pull,legs") return "Push / Pull / Legs";
    if (keys.indexOf("upper") >= 0 && keys.indexOf("lower") >= 0 && keys.length === 2) return "Upper / Lower";
    return "split";
  }

  function text(pg, m) {
    var out = [];
    out.push("*" + (m.name || "Client") + " — Training Plan*");
    out.push(pg.name + "  ·  " + M.fmtD(pg.created, "long"));
    out.push("");
    pg.days.forEach(function (d) {
      out.push("*" + d.day + " — " + d.name + "*");
      out.push("_Warm-up: " + d.warmup + "_");
      d.ex.forEach(function (e) { out.push("• " + e.name + " — " + e.sets + " × " + e.reps + " (rest " + e.rest + ")"); });
      if (d.finisher) out.push("_Finisher: " + d.finisher + "_");
      out.push("");
    });
    out.push("*Cardio:* " + pg.cardio);
    out.push("");
    out.push("*Notes*");
    pg.notes.forEach(function (n) { out.push("• " + n); });
    out.push("");
    out.push("— " + (M.store.gym.profile.name || "Momentum") + (M.store.gym.profile.trainer ? " · " + M.store.gym.profile.trainer : ""));
    return out.join("\n");
  }

  M.PROG = { build: build, text: text, SPLITS: SPLITS, SCHEME: SCHEME };
})(window);
