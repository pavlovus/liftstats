# FULL_CONTEXT.md — "LiftStats"
**A Statistical Exploration and Web Application for Strength Percentile Benchmarking**

> This file is the single source of truth for the project. Update this file whenever the group agrees to change something — don't let individual branches drift from what's written here.

---

## 1. Project Overview

**One-line pitch:** A statistical exploration + web app that tells a lifter how their squat/bench/deadlift compares to others of the same age, bodyweight, and sex — based on real competition data, not gym-bro guesswork.

**Format:** Web app (mobile-friendly) or mobile app (to be decided), no login required.

**Core deliverable split:** ~70% of the grading weight is the data science work (collection → cleaning → analysis → ML), the app is a thin, clear interface on top of that work. When in doubt about where to spend effort, prioritize the DS/ML rigor over app polish.

---

## 2. Motivation (why this project exists)

- **Target group / end-user:** Recreational and amateur lifters (gymgoers) who train with barbell exercises (squat, bench, deadlift). Not competitive powerlifters — they already have federation rankings.
- **The problem:** Existing strength standard charts online are inconsistent, often outdated, and rarely account properly for bodyweight scaling (a 60kg and 100kg lifter shouldn't be compared on raw kg lifted).
- **What we give them:** An instant, statistically grounded percentile ranking based on real competition data, replacing guesswork/influencer standards with an honest, personalized benchmark.
- **Secondary benefit:** Corrects unrealistic expectations (a body-image/motivation angle) — many lifters wildly over- or under-estimate what's "normal."

---

## 3. Data Sources — Decisions & Rationale

### 3.1 Primary dataset (confirmed, in use)
**OpenPowerlifting.org** — full open dataset, downloadable as CSV, updated regularly, no scraping/API key needed, explicitly licensed for reuse.

Contains: lift attempts (squat/bench/deadlift, in kg), bodyweight, age, sex, weight class, federation, drug-tested status, competition date, and result validity (successful/failed attempt).

This is our **only raw dataset**. It represents *competitive* lifters, not average gymgoers — this limitation must be stated explicitly in the report, not hidden.

### 3.2 Data management plan
- Store the raw OpenPowerlifting CSV untouched in `/data/raw/`.
- All cleaning happens in scripts/notebooks, never by hand-editing the raw file.
- Cleaned/processed dataset saved separately in `/data/processed/`.
- No personal privacy concerns (fully anonymized public competition results) — documentation burden is on justifying *exclusion* criteria, not on privacy.

---

## 4. Preprocessing Pipeline

**Goal:** Turn raw competition data into a clean, comparable, bodyweight-normalized dataset.

### Cleaning steps
- Drop rows with missing age, bodyweight, or sex.
- Keep only successful lift attempts (remove failed/no-lift attempts and disqualifications).
- Explicitly split data into **drug-tested** vs. **untested federations** — keep both, do not silently drop one. This split is used later as a transparency toggle feature.
- Remove impossible/erroneous values (e.g., implausible lift-to-bodyweight ratios, duplicate entries).
- Standardize units (dataset may mix kg/lb — normalize to kg).

### Transformations
- Apply **Wilks and DOTS** bodyweight-scaling formulas — compute both, don't pick just one (needed later for the Wilks-vs-DOTS toggle feature).
- Bucket continuous variables:
  - Age brackets (e.g., 18–19, 20–23, 24–29, 30–39, 40–49, 50+ — finalize exact bins as a group once data distribution is seen)
  - Weight classes (use standard IPF-style classes, or bucket by 5kg bands if cleaner)

### Feature engineering
- `age_bracket`, `weight_class` columns derived from raw values
- Percentile rank per lift, per bracket, per sex, per tested-status (the core feature the app is built on)
- `total` = squat + bench + deadlift (some users care about total more than individual lifts)
- Squat:Bench:Deadlift **ratio features** (needed for the clustering ML component, see §5.2)
- For lifters with multiple recorded meets: a per-lifter time series of `(date, total, age)` (needed for the regression ML component, see §5.1)

**Output contract (do not change without group agreement):**
A cleaned dataframe with at minimum these columns: `lifter_id, sex, age, age_bracket, bodyweight, weight_class, squat, bench, deadlift, total, wilks_score, dots_score, tested_status, date`.
Everyone builds against this schema. If real data forces a change, announce it to the group immediately — don't silently diverge.

---

## 5. Machine Learning Components (core DS/ML deliverables)

There are exactly **two ML components** in this project. Keep both intentionally simple/explainable — the goal is sound methodology, not model complexity.

### 5.1 Progression Prediction (Regression) — owned by Person C
**Question answered:** "How much more can I realistically expect to lift next year?"

- **Data needed:** Subset of lifters with 2+ recorded meets over time (extract from the multi-meet time series built in preprocessing).
- **Features:** current total/lift, age, estimated training age (time between first and current meet as a proxy), bodyweight change.
- **Target:** total/lift at a future point (e.g., ~12 months later).
- **Model:** simple linear or polynomial regression. Do not reach for complex models — defensibility and interpretability matter more than accuracy here.
- **Validation:** train/test split by lifter (not by row, to avoid leakage — same lifter's meets shouldn't span both sets), report R²/MAE, sanity-check predictions against known training-progress literature.
- **Output to app:** a predicted range (not a single false-precise number), e.g., "You could realistically reach ~X–Y kg total in a year at your current stage."

### 5.2 Training Archetype Clustering (k-means) — owned by Person B
**Question answered:** "What type of lifter are you — balanced, deadlift-dominant, bench-specialist?"

- **Data needed:** squat:bench:deadlift ratio features for all cleaned lifters (normalized, e.g., each lift as % of total).
- **Preprocessing for clustering:** scale/normalize ratios (StandardScaler or similar) before clustering.
- **Model:** k-means. Determine k via elbow method / silhouette score — don't just guess a number of clusters; justify it.
- **Interpretation step (required, not optional):** for each resulting cluster, compute and report the average ratio profile and give it a human-readable label (e.g., "Deadlift-dominant," "Balanced," "Bench-specialist," "Squat-dominant"). This interpretation write-up is part of the deliverable, not just the raw clustering code.
- **Output to app:** which cluster the user's input falls into (nearest centroid), shown with a simple comparison chart against their cluster's typical ratio profile.

> **Reminder:** both models train once on the full cleaned dataset offline — the app does NOT retrain live. It loads a saved model/lookup and applies it to user input in real time.

---

## 6. Non-ML Analytical / Transparency Features

These are still real data science work (statistics, not ML) and are core deliverables, not optional extras.

### 6.1 Core percentile engine — owned by Person A
- Percentile computation per lift, per age bracket, per weight class, per sex.
- Distribution analysis: check and report shape of lift distributions (expect right-skew) — this is a real, reportable EDA finding.
- Tested vs. untested percentile split (using the flag preserved during cleaning).

### 6.2 Tested/Untested transparency toggle — owned by Person B
Let the user see how their percentile shifts depending on whether untested-federation lifters are included. This directly demonstrates understanding of a real methodological choice (a talking point for the report/presentation).

### 6.3 Wilks vs. DOTS transparency toggle — owned by Person C
Let the user see how their ranking changes depending on which bodyweight-normalization formula is used. Demonstrates understanding of *why* the normalization choice matters, not just applying one blindly.

---

## 7. App Structure (thin layer on top of the analysis)

### Confirmed core screens (build these)
1. **Input screen** — lift, bodyweight, age, sex, weight lifted (Person A)
2. **Core results screen** — percentile number + distribution chart (Person A)
3. **"Your Training Type" screen** — cluster archetype result + tested/untested toggle (Person B)
4. **"Your Progress" screen** — regression-based next-year prediction + Wilks/DOTS toggle (Person C)
5. **Shareable result card** — auto-generated summary graphic/text (Person C)
6. **Final integration** — one cohesive app with shared navigation across the above screens (Person C leads, Week 3)

### Optional "if we finish everything else" app feature ideas (do NOT start these until 1–6 above are done and working)
- Recreational-lifter benchmark reference line (static, cited from literature — e.g., Barbell Medicine ratios), shown alongside the athlete percentile, clearly labeled as a different type of estimate
- "Most similar lifters" nearest-neighbor lookup (show a few anonymized real lifters closest to the user's stats)
- Strength Level research-API integration, only if/when access is granted
- Prettier data visualizations / animation polish
- Injury-risk-style anomaly flag for implausible self-reported progress claims

---

## 8. Team Roles & Workflow (Vertical Slices, rebalanced)

**Shared foundation (Days 1–2, everyone together):** Agree on and lock the cleaned-dataset schema (§4 output contract). Do a first-pass basic clean together so nobody builds on divergent assumptions.

After that, each person works a full vertical slice (their own data/ML logic + their own UI screen) largely in parallel, using a mock/sample version of the cleaned dataset if the real one isn't ready yet.

### Person A — Core Percentile Engine
- Full preprocessing pipeline (§4): cleaning, Wilks/DOTS calculation, bucketing
- Percentile computation + distribution analysis (§6.1)
- Input screen + core results screen (app)
- **This is the foundation — schema decisions here affect everyone, communicate changes immediately**

### Person B — Clustering + Tested/Untested Transparency
- k-means training archetype clustering, full pipeline: feature prep → k selection → clustering → interpretation (§5.2)
- Tested/untested toggle logic (§6.2)
- "Your Training Type" screen (app)

### Person C — Progression Prediction + Wilks/DOTS Transparency + Sharing
- Regression model for progression prediction, full pipeline: multi-meet subset → features → train/test split → validation (§5.1)
- Wilks/DOTS toggle logic (§6.3)
- "Your Progress" screen + shareable result card (app)

---

## 9. Known Limitations (state these honestly in the report — don't hide them)

1. OpenPowerlifting represents **competitive** lifters, not the general gym-going population — percentiles are relative to competitors, which will read as "lower" than most casual lifters expect.
2. No open dataset of "regular gymgoer" lifts exists (confirmed after real investigation — see §3.2); this is a documented, legitimate gap in the field, not a shortcut taken.
3. The regression model's predictions are estimates based on population trends, not individualized coaching advice — the app should never claim clinical/medical precision.
4. Clustering into archetypes is a simplification (real training styles are more nuanced than 3–4 clusters) — communicate cluster results as a rough, fun categorization, not a definitive label.

---

## 10. Suggested Tech Stack (adjust as a group if preferred — not fixed)

- **Data processing / ML:** Python, pandas, scikit-learn (for k-means and regression), matplotlib/plotly/seaborn for exploratory charts
- **App backend:** lightweight Python web framework (e.g., Flask or FastAPI) serving precomputed lookups/model outputs
- **App frontend:** web app (mobile-friendly) or mobile app (to be decided)
- **Repo structure suggestion:**
  ```
  /data/raw/            <- untouched OpenPowerlifting CSV
  /data/processed/      <- cleaned dataset (per §4 schema)
  /notebooks/           <- EDA, percentile computation, model development
  /models/              <- saved k-means + regression models
  /app/                 <- backend + frontend code
  FULL_CONTEXT.md        <- this file
  ```