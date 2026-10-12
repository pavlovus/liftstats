# Progression Model Notes

Regression model predicting a lifter's one-year strength gain.

## Model

- **Ridge regression** wrapped in a `StandardScaler` pipeline. Scaling is
  required because Ridge's L2 penalty applies equally to all coefficients
  and our features span very different scales (`days_to_next` in hundreds,
  `meets_so_far` in single digits). Saved pickle is the full `Pipeline`.
- **Target:** `total_gain` = next total − current total, in kg. Chosen
  over Wilks/DOTS points because it's directly interpretable ("+25 kg")
  and doesn't confound progression with bodyweight change.

## Features

| Feature | Rationale |
|---------|-----------|
| `age` | Progression slows with age. |
| `bodyweight` | Heavier lifters add more absolute kg. |
| `wilks` | Current bodyweight-adjusted strength. |
| `training_age_years` | Years since first recorded meet (experience proxy). |
| `meets_so_far` | Prior meets, 0-based. |
| `days_to_next` | Time to next meet (365 for the app's 1-year forecast). |

## Split

`GroupShuffleSplit` on `lifter_id`, 80/20. Split by **lifter**, not by row,
to prevent leakage — the same person's meets must not appear in both train
and test.

## Metrics

Reported against a **baseline** that always predicts the training-set
median `total_gain`. Without this, a low R² is uninterpretable.

Baseline (median):  MAE = 21.76 kg  R² = -0.014
Ridge pipeline:     MAE = 20.72 kg  R² = +0.115
Improvement:        4.8% MAE reduction

Residual 10th pct: -31.20 kg
Residual 90th pct: +30.98 kg
Residual sigma:    30.51 kg

The app's forecast is an **80% range** = `prediction + [q10, q90]`, not
`±σ`. Gains are right-skewed and heteroscedastic, so a symmetric σ range
would under-cover novices and over-cover intermediates.
