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

| Feature | Rationale | Unscaled Coefficient |
|---------|-----------|----------------------|
| `age` | Progression slows with age. | -0.6039 kg/year |
| `bodyweight` | Marginal weight adjustment once Wilks is controlled for. | -0.0294 kg/kg |
| `wilks` | Current bodyweight-adjusted strength (diminishing returns). | -0.1149 kg/point |
| `training_age_years` | Years since first recorded meet (experience proxy). | -0.2666 kg/year |
| `meets_so_far` | Prior meets (cumulative unique meet experience). | -0.2086 kg/meet |
| `days_to_next` | Time to next meet (365 for the app's 1-year forecast). | +0.0168 kg/day (+6.1 kg/yr) |
| `is_male` | Biological differences in absolute muscle/strength accrual. | +10.1641 kg |
| *intercept* | Baseline regression constant. | +16.3989 kg |

## Split

`GroupShuffleSplit` on `lifter_id`, 80/20. Split by **lifter**, not by row,
to prevent leakage — the same person's meets must not appear in both train
and test.
- Train: 371,146 pairs
- Test: 92,889 pairs
- Total unique lifters: 112,069 (after deduplicating same-day division entries)

## Metrics

Reported against a **naive baseline** that always predicts the training-set
median `total_gain`. Without this, a low R² is uninterpretable.

- Baseline (median):  MAE = 21.67 kg, R² = -0.015
- Ridge pipeline:     MAE = 20.46 kg, R² = +0.130
- Improvement:        5.6% MAE reduction

### Residual Distribution & Prediction Intervals

- Residual overall:   10th pct: -31.26 kg, 90th pct: +30.44 kg (sigma: 30.02 kg)
- Residual Men (M):   10th pct: -35.21 kg, 90th pct: +34.77 kg
- Residual Women (F): 10th pct: -23.54 kg, 90th pct: +23.04 kg

The app's forecast is an **80% range** = `prediction + [q10, q90]`, not
`±σ`. Gains are right-skewed and heteroscedastic, so empirical residual
quantiles reflect true historical uncertainty. Sex-specific residual
quantiles (`q10_m/q90_m` and `q10_f/q90_f`) ensure that female lifters
are not given an unrealistically wide uncertainty band calibrated on men.
