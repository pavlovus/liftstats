"""Given a user's Wilks/DOTS score, return percentile under each formula."""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
TABLES = ROOT / 'data' / 'processed' / 'percentile_tables.parquet'

_tables = None


def _get_tables():
    global _tables
    if _tables is None:
        if not TABLES.exists():
            raise FileNotFoundError(
                f"Percentile lookup tables not found at {TABLES}. "
                "Run `python scripts/build_percentile_tables.py` first."
            )
        _tables = pd.read_parquet(TABLES)
    return _tables


def _pct(score, arr):
    """Percentile rank using mid-rank (average of strict and weak), matching Person A."""
    left = np.searchsorted(arr, score, side='left')
    right = np.searchsorted(arr, score, side='right')
    return float((left + right) / (2.0 * len(arr)) * 100)


def percentiles_for(sex, age, wilks_score, dots_score):
    """Return dict with wilks_pct and dots_pct. Matches Person A's age brackets."""
    tables = _get_tables()

    # Age bracket matching Person A's 14-19, 20-23, 24-29, 30-39, 40-49, 50+
    if age <= 19:   bracket = '14-19'
    elif age <= 23: bracket = '20-23'
    elif age <= 29: bracket = '24-29'
    elif age <= 39: bracket = '30-39'
    elif age <= 49: bracket = '40-49'
    else:           bracket = '50+'

    row = tables[(tables['sex'] == sex) & (tables['age_bracket'] == bracket)]
    if row.empty:
        return {'wilks_pct': None, 'dots_pct': None, 'n': 0}

    arr_w = row.iloc[0]['wilks_scores_sorted']
    arr_d = row.iloc[0]['dots_scores_sorted']

    return {
        'wilks_pct': round(_pct(wilks_score, arr_w), 1),
        'dots_pct':  round(_pct(dots_score,  arr_d), 1),
        'n': int(row.iloc[0]['n']),
    }


if __name__ == '__main__':
    # Quick test — a 25yo male with Wilks 350, DOTS 360
    print(percentiles_for('M', 25, 350, 360))