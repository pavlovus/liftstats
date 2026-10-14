"""Given a user's Wilks/DOTS score, return percentile under each formula."""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
TABLES = ROOT / 'data' / 'processed' / 'percentile_tables.parquet'

_tables = pd.read_parquet(TABLES)


def _pct(score, arr):
    """Percentile rank: fraction of arr below score, in %."""
    return float(np.searchsorted(arr, score, side='right') / len(arr) * 100)


def percentiles_for(sex, age, wilks_score, dots_score):
    """Return dict with wilks_pct and dots_pct. Falls back to nearest bracket."""
    # Age bracket
    if age < 20:    bracket = '<20'
    elif age < 24:  bracket = '20-23'
    elif age < 30:  bracket = '24-29'
    elif age < 40:  bracket = '30-39'
    elif age < 50:  bracket = '40-49'
    elif age < 60:  bracket = '50-59'
    else:           bracket = '60+'

    row = _tables[(_tables['sex'] == sex) & (_tables['age_bracket'] == bracket)]
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