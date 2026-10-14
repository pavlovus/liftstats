"""Precompute percentile lookup tables for Wilks and DOTS rankings."""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
IN  = ROOT / 'data' / 'processed' / 'clean_data.csv'
OUT = ROOT / 'data' / 'processed' / 'percentile_tables.parquet'


def build():
    df = pd.read_csv(IN, low_memory=False)
    df = df.dropna(subset=['sex', 'age', 'bodyweight', 'wilks_score', 'dots_score'])

    # Age brackets — match A's if they exist; otherwise define here
    bins   = [0, 19, 23, 29, 39, 49, 59, 200]
    labels = ['<20', '20-23', '24-29', '30-39', '40-49', '50-59', '60+']
    df['age_bracket'] = pd.cut(df['age'], bins=bins, labels=labels)

    # For each (sex, age_bracket), store the sorted score arrays
    rows = []
    for (sex, bracket), grp in df.groupby(['sex', 'age_bracket'], observed=True):
        rows.append({
            'sex': sex,
            'age_bracket': str(bracket),
            'wilks_scores_sorted': np.sort(grp['wilks_score'].values),
            'dots_scores_sorted':  np.sort(grp['dots_score'].values),
            'n': len(grp),
        })
    tables = pd.DataFrame(rows)
    tables.to_parquet(OUT, index=False)
    print(f'Wrote {len(tables)} (sex, age_bracket) tables to {OUT}')
    print(tables[['sex', 'age_bracket', 'n']].to_string(index=False))


if __name__ == '__main__':
    build()
    