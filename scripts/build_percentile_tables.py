"""Precompute percentile lookup tables for Wilks and DOTS rankings."""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
IN  = ROOT / 'data' / 'processed' / 'clean_data.csv'
OUT = ROOT / 'data' / 'processed' / 'percentile_tables.parquet'


def build():
    pq_in = ROOT / 'data' / 'processed' / 'clean_data.parquet'
    src = pq_in if pq_in.exists() else IN
    print(f'Loading {src}...')
    if str(src).endswith('.parquet'):
        df = pd.read_parquet(src)
    else:
        df = pd.read_csv(src, low_memory=False)

    # 1. Drop bad rows
    df = df.dropna(subset=['sex', 'age', 'bodyweight', 'wilks_score', 'dots_score'])

    # 2. Filter to full-power (SBD) meets so 3-lift totals aren't compared against single lifts
    df = df[df['event'].astype(str).str.upper() == 'SBD'].copy()
    print(f'Filtered to SBD full-power events: {len(df):,} rows')

    # 3. Align age brackets with Person A schema (14-19, 20-23, 24-29, 30-39, 40-49, 50+)
    bins = [13, 19, 23, 29, 39, 49, 200]
    labels = ['14-19', '20-23', '24-29', '30-39', '40-49', '50+']
    df['age_bracket'] = pd.cut(df['age'], bins=bins, labels=labels)
    df = df.dropna(subset=['age_bracket']).copy()

    # 4. For each (sex, age_bracket), store sorted score arrays
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
    