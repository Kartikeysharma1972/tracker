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
| **Overview** | **Quick check-in** (type three letters, press Enter — press `/` from anywhere to jump there), today's floor grouped by **batch / slot**, active members, check-ins today, weekly attendance vs plan, collection vs expected, pending fees, renewals due, at-risk members (7+ days absent, with a WhatsApp nudge), PRs this week, 14-day check-in chart, goal mix, gym tonnage, muscle groups trained |
| **Members** | Card or table roster with search and filters (status, goal, level, sort). One-tap check-in, quick log, WhatsApp |
| **Member profile** | Weight chart against target, **goal ETA** ("at this rate, 80 kg by 12 Nov" — or a stalled / going-the-wrong-way warning), BMI, body fat (US Navy), lean mass, weekly rate-of-change flags, attendance history and streak, this week's sets per muscle vs last week, "not trained this week" gaps, last session with per-set detail and progressive-overload suggestions, **per-exercise progress chart** (load and estimated 1RM over time), PR table, 10-week volume trend, assigned programme, nutrition targets, measurement history with deltas, **dated session notes**, fees and payment history, medical notes |
| **Workout log** | Pick member → date → focus, build the session from a 130-movement library (search + filter), sets × weight × reps with live e1RM, auto-fill from their programme, repeat last session, per-exercise overload suggestion. Saving a session also marks attendance |
| **Attendance** | Month × member check-in board, click any cell, per-member totals |
| **Programmes** | Generates a split from days/week + level + goal (full body, upper/lower, PPL, 6-day PPL), with sets, rep ranges, rest, warm-ups, finishers, cardio prescription and progression rules. Send over WhatsApp or print |
| **Diet planner** | See below |
| **Payments** | Collection trend, expected vs collected, dues and overdue list, renewals due in the next 14 days, numbered receipts (print or WhatsApp), payment history, CSV export |
| **Business report** | Month-on-month revenue, new joins vs leavers, churn %, attendance rate, retention, sessions and tonnage, goal and experience mix, leaderboards for consistency / volume / lifetime value, CSV export |
| **Client report** | A brandable, printable one-pager per member — gym name and contact, snapshot, body composition with goal ETA, weight trend, 8-week attendance, strength records, training plan, nutrition targets with a day of meals, and coach notes. Print to PDF or send a WhatsApp summary |

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
   another in the same column, a **weekly shopping list** (the whole plan added up and grouped by
   aisle, in kg / litres where that reads better), then send on WhatsApp, copy, export CSV or print.

Protein powders are never used to anchor a normal meal — only in the shake window, or when whole
food genuinely cannot reach the target (which the plan then says out loud).

## First run

A setup wizard asks for your name, gym name, contact number and currency (₹ / $ / £ / € / AED),
then offers to start empty or load a demo gym. Everything it collects is used to brand plans,
receipts and WhatsApp messages. Re-run it any time from Settings → Setup.

## Demo data

Settings → *Load demo gym* creates 12 fictional members with 10 weeks of attendance, workouts,
weigh-ins and payments — enough to demo the whole product. *Remove demo members* cleans it out and
leaves real members untouched.

## Safety net

* Settings → full JSON backup, plus CSV exports for habits + mood, members, workouts, payments
  and the business report.
* **Import can merge** instead of replacing — new members, sessions, payments and habit days are
  added and existing ones left alone, so an old backup is safe to import on a newer device.
* The app tracks the last backup date and nudges you when it is over a week old.
* Members are **archived, not deleted** — they leave the roster but every workout, weigh-in and
  payment is kept; Settings → Archived members can restore or permanently delete them.
* Duplicate phone numbers are refused when adding a member.
* Clearing browser data still deletes everything, so keep one downloaded copy.

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
assets/js/diet.js          Diet planner + weekly shopping list
assets/js/report.js        Client report, receipts, business report
assets/js/app.js           router, nav, KPI strip, settings, PIN lock
sw.js                      service worker (network-first for code)
```

Vanilla HTML, CSS and JavaScript. No dependencies, no build step.

## Keyboard

`t` Today · `g` Habit grid · `i` Insights · `m` Members · `/` quick check-in · `?` shortcuts · `Esc` closes dialogs
