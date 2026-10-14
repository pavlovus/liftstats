import numpy as np
import pandas as pd
from typing import Optional, List, Tuple
from app.backend.schemas.percentiles import DistributionBin, PercentileResponse
from app.backend.schemas.common import SexType, LiftType

def resolve_cohort_labels(bucket_tables: dict, sex: str, age: float, bodyweight: float) -> Tuple[str, List[str]]:
    """Resolves raw age and bodyweight to cohort age_bracket and equivalent weight_classes."""
    sex = sex.strip().upper()
    if sex not in bucket_tables:
        raise ValueError(f"Sex '{sex}' not found in bucket tables")
    
    table = bucket_tables[sex]
    
    # 1. Resolve age bracket
    age_table = table["age_bracket"]
    dist = np.where(age < age_table["min"], age_table["min"] - age, 
           np.where(age > age_table["max"], age - age_table["max"], 0.0))
    dist = pd.Series(dist, index=age_table.index)
    ties = dist[dist == dist.min()].index
    if len(ties) == 1:
        bracket = str(ties[0])
    else:
        bracket = str((age_table.loc[ties, "median"] - age).abs().idxmin())
        
    # 2. Resolve weight class
    available = table["weight_classes"]
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

    chosen_class = "83" if sex == "M" else "63"
    if regular and bodyweight > regular[-1][0]:
        for limit, name in reversed(plus):
            if bodyweight > limit:
                chosen_class = name
                break
        else:
            chosen_class = plus[-1][1] if plus else regular[-1][1]
    else:
        candidates = [c for c in regular if bodyweight <= c[0] + 0.05]
        if candidates:
            chosen_class = candidates[0][1]
        elif regular:
            chosen_class = regular[-1][1]

    # 3. Find equivalent classes (e.g. 82.5 and 83)
    try:
        c_num = float(chosen_class.rstrip("+"))
        c_is_plus = chosen_class.endswith("+")
        equiv = []
        for label in available:
            try:
                n_num = float(label.rstrip("+"))
                n_is_plus = label.endswith("+")
                if n_is_plus == c_is_plus and abs(n_num - c_num) <= 1.5:
                    equiv.append(label)
            except ValueError:
                pass
        classes = sorted(equiv or [chosen_class])
    except ValueError:
        classes = [chosen_class]

    return bracket, classes

def get_demographic_cohort(
    df: pd.DataFrame,
    bucket_tables: dict,
    sex: str,
    age: float,
    bodyweight: float,
    cohort_partitions: Optional[dict] = None
) -> Tuple[pd.DataFrame, str, List[str]]:
    """Filters dataset once to the user's demographic cohort for high-speed sub-queries."""
    bracket, classes = resolve_cohort_labels(bucket_tables, sex, age, bodyweight)
    if cohort_partitions is not None and (str(sex), str(bracket)) in cohort_partitions:
        base = cohort_partitions[(str(sex), str(bracket))]
        mask = base["weight_class"].isin(classes)
        return base[mask], bracket, classes
    mask = (df["sex"] == sex) & (df["age_bracket"] == bracket) & (df["weight_class"].isin(classes))
    return df[mask], bracket, classes

def calculate_percentile_and_distribution(
    df: pd.DataFrame,
    bucket_tables: dict,
    sex: SexType,
    age: float,
    bodyweight: float,
    lift_type: LiftType,
    weight_lifted: float,
    tested_status: Optional[bool] = None,
    sbd_only: bool = False,
    num_bins: int = 25,
    cohort_df: Optional[pd.DataFrame] = None
) -> PercentileResponse:
    """
    Computes exact percentile rank, summary quantiles, and discrete distribution bins
    for the user's specific demographic peer cohort.
    """
    if cohort_df is not None:
        base = cohort_df
    else:
        bracket, classes = resolve_cohort_labels(bucket_tables, sex, age, bodyweight)
        mask = (df["sex"] == sex) & (df["age_bracket"] == bracket) & (df["weight_class"].isin(classes))
        base = df[mask]

    mask = base[lift_type].notna()

    # Full-power filtering
    if lift_type == "total" or sbd_only:
        mask &= (base["event"] == "SBD")

    if tested_status is not None:
        mask &= (base["tested_status"] == tested_status)

    subset = base[mask]
    n = len(subset)

    if n == 0:
        return PercentileResponse(
            lift_type=lift_type,
            user_weight=weight_lifted,
            percentile=None,
            population_size=0,
            error=f"No competitors found in cohort ({sex})."
        )

    lift_values = subset[lift_type].to_numpy(dtype=float)

    # Calculate mid-rank percentile
    strict_count = np.sum(lift_values < weight_lifted)
    tie_count = np.sum(lift_values == weight_lifted)
    pct = round(float((strict_count + 0.5 * tie_count) / n * 100), 1)

    # Calculate quantiles
    p25 = round(float(np.percentile(lift_values, 25)), 1)
    p50 = round(float(np.percentile(lift_values, 50)), 1)
    p75 = round(float(np.percentile(lift_values, 75)), 1)
    p90 = round(float(np.percentile(lift_values, 90)), 1)
    max_val = round(float(np.max(lift_values)), 1)

    # Generate discrete histogram bins (excluding extreme 0.2% outliers for visual elegance)
    if n >= 10:
        lo_edge = float(np.percentile(lift_values, 0.2))
        hi_edge = float(np.percentile(lift_values, 99.8))
        if lo_edge >= hi_edge:
            lo_edge = float(np.min(lift_values))
            hi_edge = float(np.max(lift_values))
        
        counts, edges = np.histogram(lift_values, bins=num_bins, range=(lo_edge, hi_edge))
        centers = (edges[:-1] + edges[1:]) / 2
        bins = [
            DistributionBin(weight=round(float(w), 1), count=int(c))
            for w, c in zip(centers, counts)
        ]
    else:
        bins = [DistributionBin(weight=round(float(v), 1), count=1) for v in sorted(lift_values)]

    return PercentileResponse(
        lift_type=lift_type,
        user_weight=round(float(weight_lifted), 1),
        percentile=pct,
        population_size=n,
        median_lift=p50,
        max_lift=max_val,
        p25=p25,
        p50=p50,
        p75=p75,
        p90=p90,
        bins=bins
    )

def build_bucket_tables(df: pd.DataFrame, min_class_count: int = 1500) -> dict:
    """Builds lookup tables for age brackets and standard weight classes per sex."""
    tables = {}
    for sex, g in df.groupby("sex", observed=True):
        wc_counts = g["weight_class"].value_counts()
        valid_classes = wc_counts[wc_counts >= min_class_count].index

        tables[str(sex)] = {
            "age_bracket": g.groupby("age_bracket", observed=True)["age"].agg(["min", "max", "median"]),
            "weight_classes": sorted([str(c) for c in valid_classes if str(c) not in ["+", "nan"]]),
        }
    return tables
