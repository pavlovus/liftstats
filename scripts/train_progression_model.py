"""Train Ridge regression on longitudinal data.

Changes from earlier version:
- Wrapped in a StandardScaler pipeline so Ridge's alpha penalises features
  on comparable scales.
- Added a naive baseline (predict the training median) so R² / MAE can be
  interpreted relative to "no model at all."
- Prediction interval uses 10th/90th percentiles of test residuals, not
  ±1σ. Gains are right-skewed and heteroscedastic, so a symmetric σ range
  under-covers.
"""
import pickle
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score

ROOT = Path(__file__).resolve().parent.parent
IN  = ROOT / 'data' / 'processed' / 'longitudinal.parquet'
OUT = ROOT / 'models' / 'progression_model.pkl'

FEATURES = ['age', 'bodyweight', 'wilks',
            'training_age_years', 'meets_so_far', 'days_to_next', 'is_male']
TARGET = 'total_gain'


def train():
    print(f'Loading {IN}')
    df = pd.read_parquet(IN)
    print(f'Rows: {len(df):,}, lifters: {df["lifter_id"].nunique():,}')

    # Add sex indicator (1 for M, 0 for F/other)
    df['is_male'] = (df['sex'] == 'M').astype(float)

    df = df.dropna(subset=[TARGET] + FEATURES).copy()

    X = df[FEATURES]
    y = df[TARGET]
    groups = df['lifter_id']

    # Split BY LIFTER to avoid leakage
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    tr, te = next(gss.split(X, y, groups))
    print(f'Train: {len(tr):,}, Test: {len(te):,}')

    # --- Baseline: predict training-set median -----------------------------
    baseline = float(np.median(y.iloc[tr]))
    baseline_pred = np.full(len(te), baseline, dtype=float)
    mae_baseline = mean_absolute_error(y.iloc[te], baseline_pred)
    r2_baseline  = r2_score(y.iloc[te], baseline_pred)

    # --- Alpha tuning grid (scaled space) ----------------------------------
    print('\nTuning alpha (with StandardScaler):')
    best = None
    for a in [0.1, 1.0, 10.0, 100.0]:
        pipe = Pipeline([('scaler', StandardScaler()),
                         ('ridge',  Ridge(alpha=a))])
        pipe.fit(X.iloc[tr], y.iloc[tr])
        p = pipe.predict(X.iloc[te])
        mae = mean_absolute_error(y.iloc[te], p)
        r2  = r2_score(y.iloc[te], p)
        print(f'  alpha={a:6.1f}  MAE={mae:6.2f}  R²={r2:+.3f}')
        if best is None or mae < best[1]:
            best = (a, mae, pipe)

    best_alpha, mae_model, model = best
    pred = model.predict(X.iloc[te])
    r2_model = r2_score(y.iloc[te], pred)

    # --- Residual distribution → prediction intervals -----------------------
    residuals = y.iloc[te].values - pred
    q10, q90 = np.percentile(residuals, [10, 90])
    sigma = float(residuals.std())

    # Sex-specific residual intervals
    test_sex = df['sex'].iloc[te].values
    m_mask = test_sex == 'M'
    f_mask = test_sex == 'F'

    q10_m, q90_m = np.percentile(residuals[m_mask], [10, 90]) if np.any(m_mask) else (q10, q90)
    q10_f, q90_f = np.percentile(residuals[f_mask], [10, 90]) if np.any(f_mask) else (q10, q90)

    print(f'\nChosen alpha: {best_alpha}')
    print(f'Baseline (median):  MAE = {mae_baseline:.2f} kg  '
          f'R² = {r2_baseline:+.3f}')
    print(f'Ridge pipeline:     MAE = {mae_model:.2f} kg  '
          f'R² = {r2_model:+.3f}')
    print(f'Improvement:        '
          f'{(1 - mae_model/mae_baseline)*100:.1f}% MAE reduction')
    print(f'\nResidual overall:  10th pct: {q10:+.2f} kg, 90th pct: {q90:+.2f} kg (sigma: {sigma:.2f} kg)')
    print(f'Residual Men (M):  10th pct: {q10_m:+.2f} kg, 90th pct: {q90_m:+.2f} kg')
    print(f'Residual Women (F):10th pct: {q10_f:+.2f} kg, 90th pct: {q90_f:+.2f} kg')

    # --- Interpretability: unscale coefficients ----------------------------
    scaler = model.named_steps['scaler']
    ridge  = model.named_steps['ridge']
    coefs_unscaled = ridge.coef_ / scaler.scale_
    print('\nCoefficients (unscaled space):')
    for f, c in zip(FEATURES, coefs_unscaled):
        print(f'  {f:22s} {c:+.4f}')
    print(f'  {"intercept":22s} {ridge.intercept_:+.4f}')

    # --- Save --------------------------------------------------------------
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, 'wb') as f:
        pickle.dump({
            'model':           model,          # the Pipeline
            'features':        FEATURES,
            'mae':             float(mae_model),
            'r2':              float(r2_model),
            'mae_baseline':    float(mae_baseline),
            'baseline_median': baseline,
            'q10':             float(q10),
            'q90':             float(q90),
            'residuals_by_sex': {
                'M': {'q10': float(q10_m), 'q90': float(q90_m)},
                'F': {'q10': float(q10_f), 'q90': float(q90_f)},
            },
            'sigma':           sigma,
            'alpha':           float(best_alpha),
        }, f)
    print(f'\nSaved → {OUT}')


if __name__ == '__main__':
    train()
    