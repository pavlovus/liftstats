"""
Tested vs. untested transparency layer (Person B, FULL_CONTEXT.md section 6.2).

This module does NOT compute percentiles. All percentile math is done by
PercentileEngine (scripts/percentile_engine.py, Person A). Here we only:
  1. map the user's raw age / bodyweight to the labels the engine filters on,
  2. call engine.get_percentile() three times (all / tested / untested),
  3. turn the three results into a plain-language explanation.

Quick demo from anywhere:
    python scripts/tested_toggle.py
"""
from pathlib import Path

import numpy as np
import pandas as pd

from percentile_engine import PercentileEngine

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CLEAN_CSV = PROJECT_ROOT / "data" / "processed" / "clean_data.csv"

LIFTS = ("squat", "bench", "deadlift", "total")
MIN_PEERS = 50  # below this we refuse to show a percentile (too noisy)


def load_engine() -> PercentileEngine:
    """Absolute path, so it works regardless of the current working directory."""
    return PercentileEngine(data_path=str(CLEAN_CSV))


# ---------- raw age / bodyweight -> engine labels ----------
# The engine filters on label strings ('20-23', '83', ...) but the user types numbers.
# Bin edges live in the data, so we recover each bucket's observed [min, max] range once
# at startup and assign the user to the closest range.

def build_bucket_tables(df: pd.DataFrame, min_class_count: int = 1500) -> dict:
    tables = {}
    for sex, g in df.groupby("sex"):
        # Filter to legitimate standard weight classes with substantial sample size (>= min_class_count)
        # This removes tiny one-off divisions (e.g. 84.5, 85.7) that corrupt bucket matching
        wc_counts = g["weight_class"].value_counts()
        valid_classes = wc_counts[wc_counts >= min_class_count].index

        tables[sex] = {
            "age_bracket": g.groupby("age_bracket")["age"].agg(["min", "max", "median"]),
            "weight_classes": sorted([str(c) for c in valid_classes if str(c) not in ["+", "nan"]]),
        }
    return tables


def _nearest_bucket(table: pd.DataFrame, x: float) -> str:
    dist = np.where(x < table["min"], table["min"] - x, np.where(x > table["max"], x - table["max"], 0.0))
    dist = pd.Series(dist, index=table.index)
    ties = dist[dist == dist.min()].index
    if len(ties) == 1:
        return ties[0]
    return (table.loc[ties, "median"] - x).abs().idxmin()


def _class_number(label: str):
    try:
        return float(label.rstrip("+")), label.endswith("+")
    except ValueError:
        return None


def _match_weight_class(bw: float, available: list) -> str:
    """Match lifter bodyweight to the appropriate competition weight class."""
    regular, plus = [], []
    for c in available:
        if c.endswith("+"):
            try:
                plus.append((float(c.rstrip("+")), c))
            except ValueError:
                pass
        else:
            try:
                regular.append((float(c), c))
            except ValueError:
                pass
    regular.sort(key=lambda x: x[0])
    plus.sort(key=lambda x: x[0])

    if regular and bw > regular[-1][0]:
        for limit, name in plus:
            if bw > limit:
                return name
        return plus[-1][1] if plus else regular[-1][1]

    # Find the lowest class limit where bw <= limit (with 0.05kg tolerance for weigh-in precision)
    candidates = [c for c in regular if bw <= c[0] + 0.05]
    if candidates:
        return candidates[0][1]
    return regular[-1][1] if regular else "83"


def _equivalent_classes(chosen: str, available, tol: float = 1.0) -> list:
    """Same class across federations, e.g. '83' (IPF) and '82.5' -> ['82.5', '83']."""
    c = _class_number(chosen)
    if c is None:
        return [chosen]
    out = []
    for label in available:
        n = _class_number(label)
        if n is not None and n[1] == c[1] and abs(n[0] - c[0]) <= tol:
            out.append(label)
    return sorted(out or [chosen])


# ---------- explanation text ----------

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


# ---------- the toggle itself ----------

def tested_toggle(engine: PercentileEngine, buckets: dict, sex: str, age: float,
                  bodyweight: float, lift: str, value: float) -> dict:
    """Percentile of `value` kg in `lift` for the user's peer group, under three federation filters."""
    if lift not in LIFTS:
        raise ValueError(f"lift must be one of {LIFTS}")
    sex = sex.strip().upper()
    if sex not in buckets:
        raise ValueError("sex must be 'M' or 'F'")

    t = buckets[sex]
    bracket = _nearest_bucket(t["age_bracket"], age)
    wclass = _match_weight_class(bodyweight, t["weight_classes"])
    classes = _equivalent_classes(wclass, t["weight_classes"])

    views = {}
    for name, status in (("all", None), ("tested", True), ("untested", False)):
        r = engine.get_percentile(
            lift_type=lift, weight_lifted=value, sex=sex,
            weight_class=classes, age_bracket=bracket, tested_status=status,
        )
        n = int(r.get("population_size", 0))
        pct = r.get("percentile")
        views[name] = {
            "n": n,
            "percentile": float(pct) if (pct is not None and n >= MIN_PEERS) else None,
        }

    return {
        "lift": lift,
        "value": value,
        "age_bracket": str(bracket),
        "weight_class": "/".join(classes),
        "views": views,
        "explainer": explain(views),
    }


if __name__ == "__main__":
    eng = load_engine()
    tb = build_bucket_tables(eng.df)
    print(tested_toggle(eng, tb, "M", 27, 83, "total", 500))