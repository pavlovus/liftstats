"""Train Ridge regression on longitudinal data. Save model + notes."""
import pickle
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import mean_absolute_error, r2_score

ROOT = Path(__file__).resolve().parent.parent
IN  = ROOT / 'data' / 'processed' / 'longitudinal.parquet'
OUT = ROOT / 'models' / 'progression_model.pkl'

# Lowercase names, matching A's cleaned schema + build_longitudinal.py output
FEATURES = ['age', 'bodyweight', 'wilks',
            'training_age_years', 'meets_so_far', 'days_to_next']
TARGET = 'total_gain'


def train():
    print(f'Loading {IN}')
    df = pd.read_parquet(IN)
    print(f'Rows: {len(df):,}, lifters: {df["lifter_id"].nunique():,}')

    # Drop any rows missing target — can't train on them
    df = df.dropna(subset=[TARGET] + FEATURES).copy()

    X = df[FEATURES]
    y = df[TARGET]
    groups = df['lifter_id']

    # Split BY LIFTER to avoid data leakage
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    tr, te = next(gss.split(X, y, groups))
    print(f'Train: {len(tr):,}, Test: {len(te):,}')

    model = Ridge(alpha=1.0)
    model.fit(X.iloc[tr], y.iloc[tr])
    pred = model.predict(X.iloc[te])

    mae = mean_absolute_error(y.iloc[te], pred)
    r2 = r2_score(y.iloc[te], pred)
    sigma = (y.iloc[te] - pred).std()

    print(f'\nMAE = {mae:.2f} kg')
    print(f'R²  = {r2:.3f}')
    print(f'sigma = {sigma:.2f} kg')
    print('\nCoefficients:')
    for f, c in zip(FEATURES, model.coef_):
        print(f'  {f:22s} {c:+.4f}')
    print(f'  {"intercept":22s} {model.intercept_:+.4f}')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, 'wb') as f:
        pickle.dump({'model': model, 'features': FEATURES,
                     'sigma': sigma, 'mae': mae, 'r2': r2}, f)
    print(f'\nSaved → {OUT}')


if __name__ == '__main__':
    train()
    