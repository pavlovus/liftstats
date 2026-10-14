import pandas as pd
from typing import Dict, List, Any
from app.backend.schemas.archetypes import ArchetypeResponse, TestedToggleData, ToggleView
from app.backend.services.percentile_service import resolve_cohort_labels
from app.backend.config import MIN_PEERS_THRESHOLD

def _ordinal(n: float) -> str:
    if n < 1:
        return "under 1st"
    if n > 99:
        return "over 99th"
    n_int = int(round(n))
    suffix = "th" if 10 <= n_int % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n_int % 10, "th")
    return f"{n_int}{suffix}"

def explain_tested_toggle(views: dict) -> str:
    all_pct = views.get("all", {}).get("percentile")
    tested_pct = views.get("tested", {}).get("percentile")
    note = (
        "Untested federations don't screen for performance-enhancing drugs, "
        "so some of their lifters may be using them. "
    )
    if all_pct is None or tested_pct is None:
        return "There aren't enough lifters in your group for one of the views to be reliable."
    
    diff = tested_pct - all_pct
    if abs(diff) < 2:
        return (
            f"It barely changes for you: {_ordinal(all_pct)} percentile against everyone, "
            f"{_ordinal(tested_pct)} against drug-tested lifters only. " + note
        )
    if diff > 0:
        return (
            f"You rank higher against drug-tested lifters only ({_ordinal(tested_pct)} percentile) "
            f"than against everyone ({_ordinal(all_pct)}). " + note +
            "Comparing with tested lifters only is the stricter, fairer yardstick for a natural lifter."
        )
    return (
        f"You rank lower against drug-tested lifters only ({_ordinal(tested_pct)} percentile) "
        f"than against everyone ({_ordinal(all_pct)}). Tested federations tend to attract "
        "more experienced, dedicated lifters in your group, so the bar is higher there. " + note
    )

def classify_archetype(kmeans_bundle: dict, sex: str, squat: float, bench: float, deadlift: float) -> dict:
    b = kmeans_bundle[sex]
    total = squat + bench + deadlift
    features = b["features"]
    shares = pd.DataFrame([[squat / total, bench / total, deadlift / total]], columns=features)
    
    scaled = b["scaler"].transform(shares)
    cid = int(b["kmeans"].predict(scaled)[0])
    
    pct = lambda d: [round(float(d[f]) * 100, 1) for f in features]
    
    return {
        "label": b["labels"][cid],
        "user_shares": [round(float(v) * 100, 1) for v in shares.iloc[0]],
        "cluster_shares": pct(b["profiles"][cid]),
        "all_clusters": {b["labels"][c]: pct(p) for c, p in b["profiles"].items()},
    }

def get_tested_toggle(
    df: pd.DataFrame,
    bucket_tables: dict,
    sex: str,
    age: float,
    bodyweight: float,
    lift: str,
    value: float,
    cohort_df: Any = None,
    bracket: Any = None,
    classes: Any = None
) -> TestedToggleData:
    if cohort_df is None or bracket is None or classes is None:
        bracket, classes = resolve_cohort_labels(bucket_tables, sex, age, bodyweight)
        mask = (df["sex"] == sex) & (df["age_bracket"] == bracket) & (df["weight_class"].isin(classes))
        base = df[mask]
    else:
        base = cohort_df
    
    views_dict = {}
    for name, status in (("all", None), ("tested", True), ("untested", False)):
        mask = base[lift].notna()
        if lift == "total":
            mask &= (base["event"] == "SBD")
        if status is not None:
            mask &= (base["tested_status"] == status)

        sub = base[mask]
        n = len(sub)
        pct = None
        if n >= MIN_PEERS_THRESHOLD:
            vals = sub[lift].to_numpy(dtype=float)
            strict_count = (vals < value).sum()
            tie_count = (vals == value).sum()
            pct = round(float((strict_count + 0.5 * tie_count) / n * 100), 1)

        views_dict[name] = {"n": n, "percentile": pct}

    explainer = explain_tested_toggle(views_dict)

    return TestedToggleData(
        lift=lift,
        value=round(float(value), 1),
        age_bracket=str(bracket),
        weight_class="/".join(classes),
        views={k: ToggleView(**v) for k, v in views_dict.items()},
        explainer=explainer
    )

def analyze_archetype(
    kmeans_bundle: dict,
    df: pd.DataFrame,
    bucket_tables: dict,
    sex: str,
    age: float,
    bodyweight: float,
    squat: float,
    bench: float,
    deadlift: float,
    lift: str = "total",
    cohort_df: Any = None,
    bracket: Any = None,
    classes: Any = None
) -> ArchetypeResponse:
    classification = classify_archetype(kmeans_bundle, sex, squat, bench, deadlift)
    
    lift_values = {
        "squat": squat,
        "bench": bench,
        "deadlift": deadlift,
        "total": squat + bench + deadlift
    }
    toggle_val = lift_values.get(lift, squat + bench + deadlift)
    
    toggle_data = get_tested_toggle(
        df=df,
        bucket_tables=bucket_tables,
        sex=sex,
        age=age,
        bodyweight=bodyweight,
        lift=lift,
        value=toggle_val,
        cohort_df=cohort_df,
        bracket=bracket,
        classes=classes
    )
    
    return ArchetypeResponse(
        label=classification["label"],
        user_shares=classification["user_shares"],
        cluster_shares=classification["cluster_shares"],
        all_clusters=classification["all_clusters"],
        toggle=toggle_data
    )
