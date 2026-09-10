/* ============================================================
   Momentum · data.exercises.js
   Exercise library with muscle mapping, equipment, split tags
   n = name · m = primary muscle · s = secondary · eq = equipment
   sp = splits it belongs to · lv = minimum level · load = typical
   working load (kg) used for demo data / suggestions
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M;

  var MUSCLES = {
    chest: { l: "Chest", grp: "push", c: "#4d7c8a" },
    shoulders: { l: "Shoulders", grp: "push", c: "#6b7280" },
    triceps: { l: "Triceps", grp: "push", c: "#7c6f5b" },
    back: { l: "Upper back", grp: "pull", c: "#0f766e" },
    lats: { l: "Lats", grp: "pull", c: "#0d9488" },
    traps: { l: "Traps", grp: "pull", c: "#3f6b5b" },
    biceps: { l: "Biceps", grp: "pull", c: "#5b5f8f" },
    forearms: { l: "Forearms", grp: "pull", c: "#7c5a3c" },
    quads: { l: "Quads", grp: "legs", c: "#b45309" },
    hamstrings: { l: "Hamstrings", grp: "legs", c: "#92400e" },
    glutes: { l: "Glutes", grp: "legs", c: "#a16207" },
    calves: { l: "Calves", grp: "legs", c: "#78350f" },
    abs: { l: "Abs", grp: "core", c: "#4b5563" },
    obliques: { l: "Obliques", grp: "core", c: "#57534e" },
    cardio: { l: "Cardio", grp: "cardio", c: "#9f1239" },
    fullbody: { l: "Full body", grp: "full", c: "#475569" }
  };
  var ORDER = ["chest", "back", "lats", "shoulders", "biceps", "triceps", "traps", "forearms", "quads", "hamstrings", "glutes", "calves", "abs", "obliques", "cardio", "fullbody"];

  function E(n, m, s, eq, sp, lv, load) {
    return { n: n, m: m, s: s || [], eq: eq, sp: sp, lv: lv || "beg", load: load || 0 };
  }

  var LIST = [
    /* ---------------- CHEST / PUSH ---------------- */
    E("Barbell Bench Press", "chest", ["triceps", "shoulders"], "barbell", ["push", "upper", "chestback"], "beg", 40),
    E("Incline Barbell Press", "chest", ["shoulders", "triceps"], "barbell", ["push", "upper", "chestback"], "int", 32),
    E("Dumbbell Bench Press", "chest", ["triceps", "shoulders"], "dumbbell", ["push", "upper", "chestback", "full"], "beg", 18),
    E("Incline Dumbbell Press", "chest", ["shoulders", "triceps"], "dumbbell", ["push", "upper", "chestback"], "beg", 14),
    E("Machine Chest Press", "chest", ["triceps"], "machine", ["push", "upper", "chestback", "full"], "first", 25),
    E("Pec Deck / Machine Fly", "chest", [], "machine", ["push", "upper", "chestback"], "first", 20),
    E("Cable Fly", "chest", [], "cable", ["push", "upper", "chestback"], "beg", 12),
    E("Push-Up", "chest", ["triceps", "abs"], "bodyweight", ["push", "upper", "full", "chestback"], "first", 0),
    E("Incline Push-Up", "chest", ["triceps"], "bodyweight", ["push", "full"], "first", 0),
    E("Dips (Chest lean)", "chest", ["triceps"], "bodyweight", ["push", "upper"], "int", 0),
    E("Dumbbell Pullover", "chest", ["lats"], "dumbbell", ["push", "chestback"], "int", 14),

    /* ---------------- SHOULDERS ---------------- */
    E("Overhead Barbell Press", "shoulders", ["triceps"], "barbell", ["push", "upper", "armsshoulders"], "int", 25),
    E("Seated Dumbbell Shoulder Press", "shoulders", ["triceps"], "dumbbell", ["push", "upper", "armsshoulders", "full"], "beg", 12),
    E("Machine Shoulder Press", "shoulders", ["triceps"], "machine", ["push", "upper", "armsshoulders"], "first", 20),
    E("Lateral Raise", "shoulders", [], "dumbbell", ["push", "upper", "armsshoulders"], "first", 6),
    E("Cable Lateral Raise", "shoulders", [], "cable", ["push", "armsshoulders"], "beg", 5),
    E("Front Raise", "shoulders", [], "dumbbell", ["push", "armsshoulders"], "first", 6),
    E("Rear Delt Fly", "shoulders", ["back"], "dumbbell", ["pull", "upper", "armsshoulders"], "first", 6),
    E("Face Pull", "shoulders", ["back", "traps"], "cable", ["pull", "upper", "armsshoulders"], "beg", 15),
    E("Arnold Press", "shoulders", ["triceps"], "dumbbell", ["push", "armsshoulders"], "int", 10),
    E("Upright Row", "traps", ["shoulders"], "barbell", ["pull", "armsshoulders"], "int", 20),
    E("Barbell Shrug", "traps", [], "barbell", ["pull", "upper", "armsshoulders"], "beg", 40),
    E("Dumbbell Shrug", "traps", [], "dumbbell", ["pull", "upper"], "first", 14),

    /* ---------------- TRICEPS ---------------- */
    E("Triceps Rope Pushdown", "triceps", [], "cable", ["push", "upper", "armsshoulders"], "first", 15),
    E("Cable Overhead Extension", "triceps", [], "cable", ["push", "armsshoulders"], "beg", 12),
    E("Skull Crusher", "triceps", [], "barbell", ["push", "armsshoulders"], "int", 20),
    E("Close-Grip Bench Press", "triceps", ["chest"], "barbell", ["push", "armsshoulders"], "int", 30),
    E("Bench Dip", "triceps", [], "bodyweight", ["push", "armsshoulders", "full"], "first", 0),
    E("Dumbbell Kickback", "triceps", [], "dumbbell", ["push", "armsshoulders"], "first", 5),

    /* ---------------- BACK / PULL ---------------- */
    E("Deadlift", "hamstrings", ["glutes", "back", "traps"], "barbell", ["pull", "lower", "legs", "full"], "int", 60),
    E("Romanian Deadlift", "hamstrings", ["glutes", "back"], "barbell", ["pull", "lower", "legs"], "beg", 40),
    E("Barbell Row", "back", ["lats", "biceps"], "barbell", ["pull", "upper", "chestback"], "int", 35),
    E("Dumbbell Row (single arm)", "lats", ["back", "biceps"], "dumbbell", ["pull", "upper", "chestback", "full"], "first", 16),
    E("Seated Cable Row", "back", ["lats", "biceps"], "cable", ["pull", "upper", "chestback"], "first", 30),
    E("Lat Pulldown", "lats", ["biceps", "back"], "machine", ["pull", "upper", "chestback", "full"], "first", 30),
    E("Close-Grip Pulldown", "lats", ["biceps"], "machine", ["pull", "upper"], "first", 28),
    E("Pull-Up", "lats", ["biceps", "back"], "bodyweight", ["pull", "upper"], "int", 0),
    E("Assisted Pull-Up", "lats", ["biceps"], "machine", ["pull", "upper"], "first", 0),
    E("Chin-Up", "lats", ["biceps"], "bodyweight", ["pull", "upper"], "int", 0),
    E("Chest-Supported Row", "back", ["lats", "biceps"], "machine", ["pull", "upper", "chestback"], "first", 28),
    E("T-Bar Row", "back", ["lats", "biceps"], "barbell", ["pull", "upper"], "int", 30),
    E("Straight-Arm Pulldown", "lats", [], "cable", ["pull", "upper"], "beg", 18),
    E("Back Extension", "glutes", ["hamstrings", "back"], "bodyweight", ["pull", "lower", "core"], "first", 0),

    /* ---------------- BICEPS / FOREARM ---------------- */
    E("Barbell Curl", "biceps", ["forearms"], "barbell", ["pull", "upper", "armsshoulders"], "first", 15),
    E("Dumbbell Curl", "biceps", ["forearms"], "dumbbell", ["pull", "upper", "armsshoulders", "full"], "first", 8),
    E("Hammer Curl", "biceps", ["forearms"], "dumbbell", ["pull", "armsshoulders"], "first", 8),
    E("Incline Dumbbell Curl", "biceps", [], "dumbbell", ["pull", "armsshoulders"], "int", 7),
    E("Cable Curl", "biceps", [], "cable", ["pull", "armsshoulders"], "first", 15),
    E("Preacher Curl", "biceps", [], "machine", ["pull", "armsshoulders"], "beg", 15),
    E("Reverse Curl", "forearms", ["biceps"], "barbell", ["pull", "armsshoulders"], "beg", 12),
    E("Wrist Curl", "forearms", [], "dumbbell", ["pull", "armsshoulders"], "first", 6),
    E("Farmer Carry", "forearms", ["traps", "abs"], "dumbbell", ["pull", "full", "core"], "beg", 20),

    /* ---------------- LEGS ---------------- */
    E("Barbell Back Squat", "quads", ["glutes", "hamstrings"], "barbell", ["legs", "lower", "full"], "int", 45),
    E("Goblet Squat", "quads", ["glutes"], "dumbbell", ["legs", "lower", "full"], "first", 12),
    E("Bodyweight Squat", "quads", ["glutes"], "bodyweight", ["legs", "lower", "full"], "first", 0),
    E("Leg Press", "quads", ["glutes"], "machine", ["legs", "lower", "full"], "first", 60),
    E("Hack Squat", "quads", ["glutes"], "machine", ["legs", "lower"], "int", 50),
    E("Front Squat", "quads", ["glutes"], "barbell", ["legs", "lower"], "adv", 35),
    E("Bulgarian Split Squat", "quads", ["glutes", "hamstrings"], "dumbbell", ["legs", "lower"], "int", 10),
    E("Walking Lunge", "quads", ["glutes"], "dumbbell", ["legs", "lower", "full"], "beg", 10),
    E("Step-Up", "quads", ["glutes"], "dumbbell", ["legs", "lower", "full"], "first", 8),
    E("Leg Extension", "quads", [], "machine", ["legs", "lower"], "first", 25),
    E("Leg Curl", "hamstrings", [], "machine", ["legs", "lower"], "first", 22),
    E("Seated Leg Curl", "hamstrings", [], "machine", ["legs", "lower"], "first", 22),
    E("Stiff-Leg Dumbbell Deadlift", "hamstrings", ["glutes"], "dumbbell", ["legs", "lower"], "beg", 16),
    E("Hip Thrust", "glutes", ["hamstrings"], "barbell", ["legs", "lower"], "beg", 40),
    E("Glute Bridge", "glutes", ["hamstrings"], "bodyweight", ["legs", "lower", "core"], "first", 0),
    E("Cable Kickback", "glutes", [], "cable", ["legs", "lower"], "first", 10),
    E("Hip Abduction Machine", "glutes", [], "machine", ["legs", "lower"], "first", 25),
    E("Standing Calf Raise", "calves", [], "machine", ["legs", "lower", "full"], "first", 40),
    E("Seated Calf Raise", "calves", [], "machine", ["legs", "lower"], "first", 25),
    E("Dumbbell Calf Raise", "calves", [], "dumbbell", ["legs", "lower"], "first", 12),

    /* ---------------- CORE ---------------- */
    E("Plank", "abs", ["obliques"], "bodyweight", ["core", "full", "legs"], "first", 0),
    E("Side Plank", "obliques", ["abs"], "bodyweight", ["core"], "first", 0),
    E("Crunch", "abs", [], "bodyweight", ["core"], "first", 0),
    E("Hanging Leg Raise", "abs", ["obliques"], "bodyweight", ["core"], "int", 0),
    E("Lying Leg Raise", "abs", [], "bodyweight", ["core"], "first", 0),
    E("Cable Crunch", "abs", [], "cable", ["core"], "beg", 25),
    E("Russian Twist", "obliques", ["abs"], "dumbbell", ["core"], "first", 5),
    E("Mountain Climber", "abs", ["cardio"], "bodyweight", ["core", "cardio", "full"], "first", 0),
    E("Dead Bug", "abs", [], "bodyweight", ["core"], "first", 0),
    E("Bicycle Crunch", "obliques", ["abs"], "bodyweight", ["core"], "first", 0),
    E("Ab Wheel Rollout", "abs", ["obliques"], "other", ["core"], "adv", 0),
    E("Pallof Press", "obliques", ["abs"], "cable", ["core"], "beg", 12),

    /* ---------------- CARDIO / CONDITIONING ---------------- */
    E("Treadmill Walk (incline)", "cardio", [], "machine", ["cardio", "full"], "first", 0),
    E("Treadmill Run", "cardio", [], "machine", ["cardio"], "beg", 0),
    E("Cycling (stationary)", "cardio", ["quads"], "machine", ["cardio"], "first", 0),
    E("Elliptical", "cardio", [], "machine", ["cardio"], "first", 0),
    E("Rowing Machine", "cardio", ["back", "lats"], "machine", ["cardio", "full"], "beg", 0),
    E("Stair Climber", "cardio", ["glutes"], "machine", ["cardio"], "beg", 0),
    E("Skipping / Jump Rope", "cardio", ["calves"], "other", ["cardio", "full"], "beg", 0),
    E("Battle Rope", "cardio", ["shoulders"], "other", ["cardio", "full"], "beg", 0),
    E("Burpee", "fullbody", ["cardio", "chest"], "bodyweight", ["cardio", "full"], "int", 0),
    E("Kettlebell Swing", "glutes", ["hamstrings", "cardio"], "other", ["cardio", "full", "lower"], "int", 12),
    E("Box Jump", "quads", ["calves", "cardio"], "other", ["cardio", "legs"], "int", 0),
    E("Sled Push", "quads", ["glutes", "cardio"], "other", ["cardio", "legs", "full"], "int", 40),

    /* ---------------- MOBILITY / WARM-UP ---------------- */
    E("Cat-Cow", "fullbody", [], "bodyweight", ["mobility"], "first", 0),
    E("World's Greatest Stretch", "fullbody", [], "bodyweight", ["mobility"], "first", 0),
    E("Band Shoulder Dislocate", "shoulders", [], "other", ["mobility"], "first", 0),
    E("Hip Flexor Stretch", "quads", ["glutes"], "bodyweight", ["mobility"], "first", 0),
    E("Ankle Mobility Drill", "calves", [], "bodyweight", ["mobility"], "first", 0),
    E("90/90 Hip Rotation", "glutes", [], "bodyweight", ["mobility"], "first", 0),
    E("Thoracic Extension on Roller", "back", [], "other", ["mobility"], "first", 0)
  ];

  var LVRANK = { first: 0, beg: 1, ret: 1, int: 2, adv: 3 };
  var COMPOUND = /Squat|Deadlift|Press|Row|Pulldown|Pull-Up|Chin-Up|Lunge|Thrust|Dip|Push-Up|Clean|Swing/i;

  var byName = {};
  LIST.forEach(function (e) { byName[e.n.toLowerCase()] = e; });

  M.EXDB = {
    LIST: LIST,
    MUSCLES: MUSCLES,
    ORDER: ORDER,
    find: function (name) { return byName[String(name || "").toLowerCase()] || null; },
    muscleOf: function (name) { var e = byName[String(name || "").toLowerCase()]; return e ? e.m : "fullbody"; },
    label: function (mu) { return (MUSCLES[mu] || { l: mu }).l; },
    color: function (mu) { return (MUSCLES[mu] || { c: "#64748b" }).c; },
    search: function (q, split) {
      q = String(q || "").trim().toLowerCase();
      return LIST.filter(function (e) {
        if (split && e.sp.indexOf(split) < 0) return false;
        if (!q) return true;
        return e.n.toLowerCase().indexOf(q) >= 0 || e.m.indexOf(q) >= 0 || e.eq.indexOf(q) >= 0;
      });
    },
    /* exercises appropriate for a split at a level, compounds first */
    forSplit: function (split, level) {
      var cap = LVRANK[level] == null ? 1 : LVRANK[level];
      var pool = LIST.filter(function (e) {
        if (e.sp.indexOf(split) < 0) return false;
        if (LVRANK[e.lv] > cap) return false;
        if (split !== "cardio" && split !== "full" && e.m === "cardio") return false;
        return true;
      });
      /* first-timers: prefer machines & bodyweight */
      if (cap === 0) {
        pool.sort(function (a, b) {
          var ai = (a.eq === "machine" || a.eq === "bodyweight" ? 0 : 1), bi = (b.eq === "machine" || b.eq === "bodyweight" ? 0 : 1);
          if (ai !== bi) return ai - bi;
          return (COMPOUND.test(b.n) ? 1 : 0) - (COMPOUND.test(a.n) ? 1 : 0);
        });
      } else {
        pool.sort(function (a, b) { return (COMPOUND.test(b.n) ? 1 : 0) - (COMPOUND.test(a.n) ? 1 : 0); });
      }
      return pool;
    },
    isCompound: function (name) { return COMPOUND.test(name || ""); },
    equipment: function () {
      var s = {}; LIST.forEach(function (e) { s[e.eq] = 1; });
      return Object.keys(s).sort();
    }
  };
})(window);
