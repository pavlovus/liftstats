"""
Tested vs. untested transparency logic (Person B, FULL_CONTEXT.md section 6.2).

Also hosts the lifter-table builder shared with cluster_archetypes.py.

Quick demo from the project root:
    python scripts/tested_toggle.py
"""
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CLEAN_CSV = PROJECT_ROOT / "data" / "processed" / "clean_data.csv"

LIFTS = ("squat", "bench", "deadlift", "total")
MIN_PEERS = 50  # below this we refuse to show a percentile (too noisy)

# Values in `tested_status` that mean "drug-tested". Exact match on purpose:
# "untested" must NOT count as tested. Adjust if your clean_data.csv uses other labels.
_TESTED_VALUES = {"yes", "y", "true", "1", "tested", "drug tested", "drug-tested"}


def to_tested_flag(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip().str.lower().isin(_TESTED_VALUES)


def build_lifter_table(df: pd.DataFrame) -> pd.DataFrame:
    """Full-power (SBD) meets only, valid lifts, ONE row per lifter (their best total)."""
    df = df.copy()
    if "event" in df.columns:
        df = df[df["event"] == "SBD"]
    needed = ["lifter_id", "sex", "age", "bodyweight", "squat", "bench", "deadlift", "total"]
    df = df.dropna(subset=needed)
    df = df[(df[["squat", "bench", "deadlift", "total"]] > 0).all(axis=1)]
    df["is_tested"] = to_tested_flag(df["tested_status"])
    df = df.sort_values("total", ascending=False).drop_duplicates("lifter_id")
    return df.reset_index(drop=True)


# ---------- peer-group lookup ----------
# Person A's bracket/class edges live in the data, so we recover them from it:
# each bucket's observed [min, max] range, and a user goes to the closest range.

def _nearest_bucket(df: pd.DataFrame, bucket_col: str, value_col: str, x: float):
    t = df.groupby(bucket_col)[value_col].agg(["min", "max", "median"])
    dist = np.where(x < t["min"], t["min"] - x, np.where(x > t["max"], x - t["max"], 0.0))
    dist = pd.Series(dist, index=t.index)
    ties = dist[dist == dist.min()].index
    if len(ties) == 1:
        return ties[0]
    return (t.loc[ties, "median"] - x).abs().idxmin()


def percentile_of(values, x: float) -> float:
    v = np.asarray(values, dtype=float)
    return float((np.sum(v < x) + 0.5 * np.sum(v == x)) / len(v) * 100)


def _ordinal(n: float) -> str:
    if n < 1:
        return "under 1st"
    if n > 99:
        return "over 99th"
    n = int(round(n))
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def explain(views: dict) -> str:
    a, t = views["all"]["percentile"], views["tested"]["percentile"]
    note = ("Untested federations don't screen for performance-enhancing drugs, "
            "so some of their lifters may be using them. ")
    if a is None or t is None:
        return "There aren't enough lifters in your group for one of the views to be reliable."
    diff = t - a
    if abs(diff) < 2:
        return (f"It barely changes for you: {_ordinal(a)} percentile against everyone, "
                f"{_ordinal(t)} against drug-tested lifters only. " + note)
    if diff > 0:
        return (f"You rank higher against drug-tested lifters only ({_ordinal(t)} percentile) "
                f"than against everyone ({_ordinal(a)}). " + note +
                "Comparing with tested lifters only is the stricter, fairer yardstick for a natural lifter.")
    return (f"You rank lower against drug-tested lifters only ({_ordinal(t)} percentile) "
            f"than against everyone ({_ordinal(a)}). Tested federations tend to attract "
            "more experienced, dedicated lifters in your group, so the bar is higher there. " + note)


def tested_toggle(table: pd.DataFrame, sex: str, age: float, bodyweight: float,
                  lift: str, value: float) -> dict:
    """Percentile of `value` kg in `lift` for the user's peer group, under three federation filters."""
    if lift not in LIFTS:
        raise ValueError(f"lift must be one of {LIFTS}")
    sex = sex.strip().upper()
    sex_df = table[table["sex"] == sex]
    if sex_df.empty:
        raise ValueError("sex must be 'M' or 'F'")

    bracket = _nearest_bucket(sex_df, "age_bracket", "age", age)
    wclass = _nearest_bucket(sex_df, "weight_class", "bodyweight", bodyweight)
    peers = sex_df[(sex_df["age_bracket"] == bracket) & (sex_df["weight_class"] == wclass)]

    groups = {"all": peers, "tested": peers[peers["is_tested"]], "untested": peers[~peers["is_tested"]]}
    views = {}
    for name, g in groups.items():
        n = len(g)
        views[name] = {
            "n": n,
            "percentile": round(percentile_of(g[lift], value), 1) if n >= MIN_PEERS else None,
        }
    return {
        "lift": lift,
        "value": value,
        "age_bracket": str(bracket),
        "weight_class": str(wclass),
        "views": views,
        "explainer": explain(views),
    }


if __name__ == "__main__":
    tbl = build_lifter_table(pd.read_csv(CLEAN_CSV))
    print(f"{len(tbl):,} lifters in peer table")
    print(tested_toggle(tbl, "M", 27, 83, "total", 500))