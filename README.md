# Momentum — Discipline Tracker + Gym Studio

An offline-first, installable web app in two halves:

**Personal** — a daily discipline tracker (habit matrix, streaks, mental-state log, insights).
**Gym Studio** — everything a trainer needs to run a floor: members, attendance, workout logging,
progress analytics, auto-built training programmes, and an Indian-food diet plan generator.

No server, no account, no tracking. All data lives in the browser's `localStorage`
(`momentum_v5`), and older versions (`momentum_v4`, `glassTracker_v*`) migrate automatically on
first load.

---

## Running it

* **Double-click `index.html`** — works straight off the disk.
* Or serve the folder: `python -m http.server 8080` → <http://localhost:8080>
  (needed for the service worker / installable app).
* Install as an app: Chrome → install icon in the address bar. iPhone: Safari → Share → *Add to Home Screen*.

## Personal module

| View | What it does |
| --- | --- |
| **Today** | Completion ring, today's checklist (tap to cycle done → missed → clear), 1–10 mood / motivation / day-score, 14-day trend |
| **Habit grid** | Landscape month matrix — habits as rows (Build / Quit / Count), days as columns, sticky header and first column, click cycles a cell, right-click clears. Mental-state matrix underneath |
| **Insights** | Weekly bars, month heatmap, streak leaderboard, per-habit month completion, trend chart, mood vs motivation |

Habit types: **Build** (✓ = done), **Quit** (✓ = stayed clean), **Count** (tally, e.g. cups of coffee).
Per-habit colour, emoji, weekly goal, streaks, archive/restore.

## Gym Studio

| View | What it does |
| --- | --- |
| **Overview** | Active members, check-ins today, weekly attendance vs plan, collection vs expected, pending fees, at-risk members (7+ days absent, with a WhatsApp nudge), PRs this week, 14-day check-in chart, goal mix, gym tonnage, muscle groups trained |
| **Members** | Card or table roster with search and filters (status, goal, level, sort). One-tap check-in, quick log, WhatsApp |
| **Member profile** | Weight chart against target, BMI, body fat (US Navy), lean mass, weekly rate-of-change with a too-fast/too-slow flag, attendance history and streak, this week's sets per muscle vs last week, "not trained this week" gaps, last session with per-set detail and progressive-overload suggestions, PR table (best e1RM per lift), 10-week volume trend, assigned programme, nutrition targets, measurement history with deltas, fees and payment history, medical notes. Printable as a client report |
| **Workout log** | Pick member → date → focus, build the session from a 130-movement library (search + filter), sets × weight × reps with live e1RM, auto-fill from their programme, repeat last session, per-exercise overload suggestion. Saving a session also marks attendance |
| **Attendance** | Month × member check-in board, click any cell, per-member totals |
| **Programmes** | Generates a split from days/week + level + goal (full body, upper/lower, PPL, 6-day PPL), with sets, rep ranges, rest, warm-ups, finishers, cardio prescription and progression rules. Send over WhatsApp or print |
| **Diet planner** | See below |
| **Payments** | Collection trend, expected vs collected, dues and overdue list, payment history, CSV export |

### Diet plan generator

Inputs: sex, age, height, weight, goal, experience level, daily activity, diet preference, meals
per day, training days, allergies.

1. **BMR** — Mifflin-St Jeor. **TDEE** — activity factor (+ a bump for 5-6 training days).
2. **Calories** — goal- and level-adjusted (a first-timer or a comeback client gets a gentler
   deficit than an advanced lifter), with a hard safety floor.
3. **Macros** — protein by g/kg (adjusted bodyweight when BMI > 27.5, capped at 42% of calories),
   fat 25% of calories with a 0.6 g/kg minimum, carbs as the remainder with a floor for
   strength/endurance goals.
4. **Meals** — a 7-day rotating plan built from ~95 Indian foods (roti, dal, katori portions,
   paneer, curd, idli, poha, chana, soya, tofu, chicken, fish, eggs…), filtered by
   veg / eggetarian / non-veg / vegan and by allergies (dairy, nut, gluten, soy, egg).
   Each meal gets a protein anchor, a carb anchor, vegetables, fruit and fats, then portions are
   nudged in realistic steps (a roti, half a katori, 10 g) until the day lands on target —
   in testing, within **~2% of the calorie target on average** and **≥95% of the protein target**.
5. **Output** — per-meal tables with quantities and macros, day totals against target, hydration
   and fibre, level-specific coach notes, supplement guidance (food first), swap any item for
   another in the same column, then send on WhatsApp, copy, export CSV or print.

Protein powders are never used to anchor a normal meal — only in the shake window, or when whole
food genuinely cannot reach the target (which the plan then says out loud).

## Demo data

Settings → *Load demo gym* creates 12 fictional members with 10 weeks of attendance, workouts,
weigh-ins and payments — enough to demo the whole product. *Remove demo members* cleans it out and
leaves real members untouched.

## Backups

Settings → full JSON backup, plus CSV exports for habits + mood, members, workouts and payments.
Clearing browser data deletes everything, so keep a backup.

## Structure

```
index.html                 app shell
assets/css/tokens.css      design tokens (light + dark)
assets/css/base.css        reset, app shell, responsive, print
assets/css/components.css  buttons, fields, cards, tables, charts, modals
assets/css/views.css       habit matrix, today, gym, diet, programme views
assets/js/core.js          helpers, icon set, SVG chart primitives
assets/js/store.js         schema v5, migration, habit + gym queries, demo seed
assets/js/data.exercises.js  130 exercises with muscle mapping
assets/js/data.foods.js      ~95 Indian foods with per-portion macros
assets/js/nutrition.js     calorie/macro engine + meal plan solver
assets/js/programs.js      training split generator
assets/js/ui.js            toast, modal, drawer, form helpers
assets/js/habits.js        Today / Grid / Insights
assets/js/gym.js           Overview / Members / Member profile
assets/js/gym-log.js       Workout logger / Attendance / Programmes / Payments
assets/js/diet.js          Diet planner
assets/js/app.js           router, nav, KPI strip, settings, PIN lock
sw.js                      service worker (network-first for code)
```

Vanilla HTML, CSS and JavaScript. No dependencies, no build step.

## Keyboard

`t` Today · `g` Habit grid · `i` Insights · `m` Members · `?` shortcuts · `Esc` close dialogs
