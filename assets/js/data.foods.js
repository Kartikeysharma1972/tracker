/* ============================================================
   Momentum · data.foods.js
   Indian-first food database for the diet plan generator.
   F(name, role, baseQty, baseUnit, step, min, max, kcal, P, C, F, tags, meals)
     role : p=protein anchor · c=carb anchor · v=veg · f=fat/nuts · fr=fruit · d=drink · x=extra
     tags : veg vegan egg nonveg dairy gluten nut soy  (allergen + diet flags)
     meals: b=breakfast l=lunch s=snack d=dinner pre=pre-workout post=post-workout
   Macros are per baseQty of baseUnit (g / ml / piece / katori).
   A "katori" is a standard 150 ml Indian bowl.
   ============================================================ */
(function (w) {
  "use strict";
  var M = w.M;

  function F(n, r, bq, bu, st, mn, mx, kcal, p, c, f, tags, meals) {
    return { n: n, r: r, bq: bq, bu: bu, st: st, mn: mn, mx: mx, kcal: kcal, p: p, c: c, f: f, tags: tags.split(" "), meals: meals.split(" ") };
  }

  var LIST = [
    /* ---------------- PROTEIN ANCHORS · veg ---------------- */
    F("Paneer (low fat)", "p", 100, "g", 10, 50, 250, 205, 22, 4, 12, "veg dairy", "b l d post"),
    F("Paneer (full fat)", "p", 100, "g", 10, 40, 200, 265, 18, 4, 20, "veg dairy", "b l d"),
    F("Tofu", "p", 100, "g", 10, 60, 250, 145, 16, 3, 8, "veg vegan soy", "b l d"),
    F("Soya chunks (dry weight)", "p", 30, "g", 10, 20, 70, 100, 15, 10, 0.4, "veg vegan soy", "l d"),
    F("Whey protein", "p", 1, "scoop", 0.5, 0.5, 2, 120, 24, 3, 1.5, "veg dairy supp", "b s post pre"),
    F("Plant protein (pea / soy isolate)", "p", 1, "scoop", 0.5, 0.5, 2, 110, 25, 2, 1.5, "veg vegan soy supp", "b s post pre"),
    F("Greek yogurt / hung curd", "p", 100, "g", 25, 50, 250, 97, 9, 4, 5, "veg dairy", "b s post"),
    F("Curd (dahi)", "p", 1, "katori", 0.5, 0.5, 2, 90, 5.5, 7, 4.5, "veg dairy", "l d s"),
    F("Moong dal (cooked)", "p", 1, "katori", 0.5, 0.5, 3, 145, 9, 20, 3, "veg vegan", "l d"),
    F("Toor / arhar dal (cooked)", "p", 1, "katori", 0.5, 0.5, 3, 150, 9, 21, 3, "veg vegan", "l d"),
    F("Rajma (cooked)", "p", 1, "katori", 0.5, 0.5, 2.5, 165, 10, 25, 2, "veg vegan", "l d"),
    F("Chole / chana masala", "p", 1, "katori", 0.5, 0.5, 2.5, 190, 10, 28, 4, "veg vegan", "l d"),
    F("Boiled kala chana", "p", 100, "g", 25, 50, 250, 164, 9, 27, 2.6, "veg vegan", "s l"),
    F("Moong sprouts", "p", 100, "g", 25, 50, 250, 100, 7, 18, 0.5, "veg vegan", "b s"),
    F("Sattu (roasted gram flour)", "p", 30, "g", 10, 20, 60, 122, 7, 18, 2, "veg vegan", "b pre"),
    F("Milk (toned)", "p", 200, "ml", 50, 100, 400, 118, 6.4, 9.6, 6.4, "veg dairy", "b s"),
    F("Milk (double toned / skim)", "p", 200, "ml", 50, 100, 400, 78, 6.8, 10, 1.5, "veg dairy", "b s"),

    /* ---------------- PROTEIN ANCHORS · egg + non-veg ---------------- */
    F("Whole egg (boiled)", "p", 1, "egg", 1, 1, 6, 72, 6.3, 0.4, 5, "egg", "b s post"),
    F("Egg white", "p", 1, "white", 1, 1, 8, 17, 3.6, 0.2, 0.1, "egg", "b post"),
    F("Egg bhurji (2 eggs, 1 tsp oil)", "p", 1, "plate", 1, 1, 2, 190, 13, 2, 14, "egg", "b d"),
    F("Chicken breast (grilled)", "p", 100, "g", 25, 75, 300, 165, 31, 0, 3.6, "nonveg", "l d post"),
    F("Chicken curry (home style)", "p", 150, "g", 25, 75, 300, 245, 27, 5, 12, "nonveg", "l d"),
    F("Chicken tikka (dry)", "p", 150, "g", 25, 75, 300, 250, 33, 3, 11, "nonveg", "l d s"),
    F("Fish (rohu / surmai, grilled)", "p", 100, "g", 25, 75, 300, 130, 22, 0, 4, "nonveg", "l d"),
    F("Fish curry", "p", 1, "katori", 0.5, 0.5, 2, 175, 20, 5, 8, "nonveg", "l d"),
    F("Prawns (cooked)", "p", 100, "g", 25, 75, 250, 99, 24, 0.2, 0.3, "nonveg", "l d"),
    F("Mutton curry", "p", 100, "g", 25, 75, 250, 250, 24, 4, 15, "nonveg", "l d"),
    F("Tuna (canned in water)", "p", 100, "g", 25, 50, 200, 116, 26, 0, 1, "nonveg", "l s d"),
    F("Egg omelette (2 eggs)", "p", 1, "plate", 1, 1, 2, 200, 13, 2, 15, "egg", "b d"),

    /* ---------------- CARB ANCHORS ---------------- */
    F("Roti (wheat, no ghee)", "c", 1, "roti", 1, 1, 6, 104, 3, 20, 2, "veg vegan gluten", "l d b"),
    F("Bajra / jowar roti", "c", 1, "roti", 1, 1, 5, 97, 3, 18, 1, "veg vegan", "l d"),
    F("Rice (cooked)", "c", 1, "katori", 0.5, 0.5, 3, 195, 4, 43, 0.4, "veg vegan", "l d"),
    F("Brown rice (cooked)", "c", 1, "katori", 0.5, 0.5, 3, 180, 4.5, 38, 1.4, "veg vegan", "l d"),
    F("Daliya (broken wheat, cooked)", "c", 1, "katori", 0.5, 0.5, 3, 160, 5, 32, 1, "veg vegan gluten", "b d"),
    F("Oats (dry weight)", "c", 40, "g", 10, 20, 90, 150, 5, 27, 3, "veg vegan gluten", "b s pre"),
    F("Poha (cooked)", "c", 1, "katori", 0.5, 0.5, 2.5, 180, 4, 35, 3, "veg vegan", "b s"),
    F("Upma (cooked)", "c", 1, "katori", 0.5, 0.5, 2.5, 190, 5, 30, 6, "veg vegan", "b s"),
    F("Idli", "c", 1, "idli", 1, 1, 6, 58, 2, 12, 0.4, "veg vegan", "b s"),
    F("Plain dosa", "c", 1, "dosa", 1, 1, 3, 133, 3, 25, 3, "veg vegan", "b d"),
    F("Besan chilla", "c", 1, "chilla", 1, 1, 4, 120, 6, 12, 5, "veg vegan", "b d s"),
    F("Brown bread", "c", 1, "slice", 1, 1, 4, 70, 2.6, 13, 1, "veg vegan gluten", "b s"),
    F("Sweet potato (boiled)", "c", 100, "g", 25, 50, 300, 86, 1.6, 20, 0.1, "veg vegan", "s l post"),
    F("Potato (boiled)", "c", 100, "g", 25, 50, 300, 87, 2, 20, 0.1, "veg vegan", "l d"),
    F("Quinoa (cooked)", "c", 1, "katori", 0.5, 0.5, 2.5, 180, 6, 32, 3, "veg vegan", "l d"),
    F("Khichdi (dal + rice)", "c", 1, "katori", 0.5, 0.5, 3, 200, 7, 33, 4, "veg vegan", "l d"),
    F("Puffed rice / murmura", "c", 30, "g", 10, 20, 60, 110, 2, 24, 1, "veg vegan", "s"),
    F("Roasted makhana", "c", 20, "g", 5, 10, 40, 70, 2, 15, 0.2, "veg vegan", "s"),

    /* ---------------- VEGETABLES ---------------- */
    F("Mixed veg sabzi", "v", 1, "katori", 0.5, 0.5, 2, 110, 3, 12, 5, "veg vegan", "l d"),
    F("Bhindi sabzi", "v", 1, "katori", 0.5, 0.5, 2, 105, 2, 10, 6, "veg vegan", "l d"),
    F("Lauki / tinda sabzi", "v", 1, "katori", 0.5, 0.5, 2, 80, 2, 9, 4, "veg vegan", "l d"),
    F("Palak (spinach) sabzi", "v", 1, "katori", 0.5, 0.5, 2, 90, 4, 8, 4.5, "veg vegan", "l d"),
    F("Cabbage / beans stir fry", "v", 1, "katori", 0.5, 0.5, 2, 85, 3, 10, 4, "veg vegan", "l d"),
    F("Green salad (no dressing)", "v", 1, "plate", 0.5, 0.5, 2, 45, 2, 8, 0.5, "veg vegan", "l d s"),
    F("Cucumber raita", "v", 1, "katori", 0.5, 0.5, 2, 80, 4, 7, 4, "veg dairy", "l d"),
    F("Steamed broccoli / veggies", "v", 150, "g", 25, 75, 300, 52, 4, 8, 0.6, "veg vegan", "l d"),
    F("Sambar", "v", 1, "katori", 0.5, 0.5, 2, 120, 5, 16, 3.5, "veg vegan", "b l d"),
    F("Rasam / clear veg soup", "v", 1, "bowl", 1, 1, 2, 60, 2, 9, 1.5, "veg vegan", "l d"),

    /* ---------------- FATS · NUTS · SEEDS ---------------- */
    F("Almonds", "f", 10, "pieces", 5, 5, 25, 82, 3, 3, 7, "veg vegan nut", "b s"),
    F("Walnuts", "f", 4, "halves", 2, 2, 10, 65, 1.5, 1.4, 6.5, "veg vegan nut", "b s"),
    F("Peanuts (roasted)", "f", 30, "g", 10, 10, 50, 170, 7.5, 6, 14, "veg vegan nut", "s pre"),
    F("Peanut butter", "f", 1, "tbsp", 0.5, 0.5, 3, 95, 4, 3.5, 8, "veg vegan nut", "b s"),
    F("Ghee", "f", 1, "tsp", 0.5, 0.5, 3, 45, 0, 0, 5, "veg dairy", "l d b"),
    F("Cooking oil (mustard / rice bran)", "f", 1, "tsp", 0.5, 0.5, 3, 45, 0, 0, 5, "veg vegan", "l d b"),
    F("Chia seeds", "f", 1, "tbsp", 0.5, 0.5, 2, 60, 2, 5, 4, "veg vegan", "b s"),
    F("Flax seeds (ground)", "f", 1, "tbsp", 0.5, 0.5, 2, 55, 2, 3, 4, "veg vegan", "b s"),
    F("Pumpkin seeds", "f", 20, "g", 5, 5, 30, 111, 6, 3, 9, "veg vegan", "s"),
    F("Coconut chutney", "f", 2, "tbsp", 1, 1, 4, 90, 2, 4, 7, "veg vegan", "b"),
    F("Cheese slice", "f", 1, "slice", 1, 1, 2, 70, 4, 1, 5.5, "veg dairy", "b s"),

    /* ---------------- FRUIT ---------------- */
    F("Banana", "fr", 1, "medium", 1, 1, 3, 105, 1.3, 27, 0.4, "veg vegan", "b s pre post"),
    F("Apple", "fr", 1, "medium", 1, 1, 2, 95, 0.5, 25, 0.3, "veg vegan", "b s"),
    F("Papaya", "fr", 150, "g", 50, 100, 300, 65, 0.7, 16, 0.4, "veg vegan", "b s"),
    F("Orange / mosambi", "fr", 1, "medium", 1, 1, 3, 62, 1.2, 15, 0.2, "veg vegan", "s"),
    F("Guava", "fr", 1, "medium", 1, 1, 3, 68, 2.6, 14, 1, "veg vegan", "s"),
    F("Watermelon", "fr", 200, "g", 50, 100, 400, 60, 1.2, 15, 0.3, "veg vegan", "s"),
    F("Pomegranate", "fr", 100, "g", 25, 50, 200, 83, 1.7, 19, 1.2, "veg vegan", "s b"),
    F("Dates", "fr", 2, "pieces", 1, 1, 5, 110, 1, 27, 0.2, "veg vegan", "pre s"),

    /* ---------------- DRINKS / EXTRAS ---------------- */
    F("Buttermilk (chaas)", "d", 1, "glass", 1, 1, 3, 40, 2, 4, 1.5, "veg dairy", "l d s"),
    F("Coconut water", "d", 200, "ml", 50, 100, 400, 38, 0.6, 9, 0, "veg vegan", "s post"),
    F("Black coffee (no sugar)", "d", 1, "cup", 1, 1, 3, 5, 0.3, 0.5, 0, "veg vegan", "b pre s"),
    F("Green tea", "d", 1, "cup", 1, 1, 4, 2, 0, 0.5, 0, "veg vegan", "b s"),
    F("Lemon water", "d", 1, "glass", 1, 1, 4, 8, 0.1, 2, 0, "veg vegan", "b s"),
    F("Dark chocolate (70%)", "x", 10, "g", 5, 5, 25, 60, 0.7, 4.5, 4.3, "veg dairy", "s"),
    F("Bhel (sprouts based)", "x", 1, "katori", 0.5, 0.5, 2, 150, 6, 24, 3, "veg vegan", "s"),
    F("Protein shake (whey + milk)", "x", 1, "glass", 1, 1, 2, 235, 30, 12, 7, "veg dairy supp", "post s pre")
  ];

  /* diet-pref → allowed tag test */
  function allowed(food, diet, allergies) {
    var t = food.tags, i;
    if (diet === "veg" && (t.indexOf("nonveg") >= 0 || t.indexOf("egg") >= 0)) return false;
    if (diet === "egg" && t.indexOf("nonveg") >= 0) return false;
    if (diet === "vegan" && (t.indexOf("nonveg") >= 0 || t.indexOf("egg") >= 0 || t.indexOf("dairy") >= 0)) return false;
    for (i = 0; i < (allergies || []).length; i++) if (t.indexOf(allergies[i]) >= 0) return false;
    return true;
  }

  M.FOODS = {
    LIST: LIST,
    allowed: allowed,
    find: function (n) { return LIST.filter(function (f) { return f.n === n; })[0] || null; },
    pool: function (diet, allergies, role, meal) {
      return LIST.filter(function (f) {
        if (role && f.r !== role) return false;
        if (meal && f.meals.indexOf(meal) < 0) return false;
        return allowed(f, diet, allergies);
      });
    },
    /* macros of a chosen quantity (in display units) */
    macro: function (food, amount) {
      var k = amount / food.bq;
      return {
        kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k,
        amount: amount, unit: food.bu, name: food.n
      };
    },
    /* pretty quantity, e.g. "2 roti", "150 g", "1.5 katori" */
    qty: function (food, amount) {
      var a = Math.round(amount * 100) / 100;
      if (food.bu === "g" || food.bu === "ml") return a + " " + food.bu;
      var unit = food.bu;
      if (a !== 1 && /^(egg|white|roti|idli|dosa|chilla|slice|medium|cup|glass|plate|bowl|scoop|katori|tbsp|tsp|piece)$/.test(unit)) {
        if (unit === "piece") unit = "pieces";
        else if (unit === "medium") unit = "medium";
      }
      return (a % 1 === 0 ? a : a.toFixed(1)) + " " + unit;
    },
    ALLERGENS: [["dairy", "Dairy / milk"], ["nut", "Nuts / peanut"], ["gluten", "Gluten / wheat"], ["soy", "Soy"], ["egg", "Egg"]]
  };
})(window);
