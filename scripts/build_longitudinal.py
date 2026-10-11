"""Build longitudinal dataset: lifters with 2+ meets, gains computed.

Consumes A's cleaned dataset (data/processed/clean_data.csv) with columns:
  lifter_id, sex, age, age_bracket, bodyweight, weight_class,
  squat, bench, deadlift, total, wilks_score, dots_score,
  tested_status, date, event
"""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
PROCESSED = ROOT / 'data' / 'processed'
INPUT_CSV = PROCESSED / 'clean_data.csv'
OUT = PROCESSED / 'longitudinal.parquet'


def build():
    print(f'Loading {INPUT_CSV}')
    df = pd.read_csv(INPUT_CSV, low_memory=False)
    print(f'Loaded {len(df):,} rows, {len(df.columns)} columns')

    # 1. Parse date & drop bad rows
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date', 'total', 'bodyweight', 'sex', 'age'])

    # 2. Filter to full-power meets (verify 'event' values first!)
    #    A may have already filtered Raw equipment — check with them.
    df = df[df['event'].astype(str).str.upper() == 'SBD'].copy()
    print(f'After SBD filter: {len(df):,} rows')

    # 3. A already gave us lifter_id — no synthetic ID needed.
    df = df.sort_values(['lifter_id', 'date'])

    # 4. wilks_score and dots_score already computed by A — reuse them.
    #    (Rename for convenience.)
    df = df.rename(columns={'wilks_score': 'wilks', 'dots_score': 'dots'})

    # 5. Next-meet features per lifter
    g = df.groupby('lifter_id')
    df['next_total'] = g['total'].shift(-1)
    df['next_wilks'] = g['wilks'].shift(-1)
    df['next_date']  = g['date'].shift(-1)
    df['meets_so_far'] = g.cumcount()
    df['first_date'] = g['date'].transform('min')
    df['training_age_years'] = (df['date'] - df['first_date']).dt.days / 365.25

    # Keep only rows that have a next meet
    df = df.dropna(subset=['next_date']).copy()
    
    # Survivorship bias filter: keep only lifters with 3+ meets (per FULL_CONTEXT §5.1)
    meet_counts = df.groupby('lifter_id')['date'].transform('count')
    df = df[meet_counts >= 3].copy()
    print(f'After 3+ meet filter: {len(df):,} rows, {df["lifter_id"].nunique():,} lifters')

    # 6. Gains
    df['days_to_next'] = (df['next_date'] - df['date']).dt.days
    df['total_gain']   = df['next_total'] - df['total']
    df['wilks_gain']   = df['next_wilks'] - df['wilks']

    # 7. Sanity filters
    df = df[(df['days_to_next'] > 30) & (df['days_to_next'] < 5 * 365)]
    df = df[df['total_gain'].between(-100, 300)]

    # 8. Save
    df.to_parquet(OUT, index=False)
    print(f'\nWrote {len(df):,} rows to {OUT}')
    print(f'Unique lifters: {df["lifter_id"].nunique():,}')


if __name__ == '__main__':
    build()
    