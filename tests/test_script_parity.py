from scripts.percentile_engine import PercentileEngine
from scripts.tested_toggle import tested_toggle as script_tested_toggle
from scripts.scoring import wilks as script_wilks, dots as script_dots
from scripts.wilks_dots_toggle import percentiles_for as script_percentiles_for

from app.backend.services.percentile_service import (
    calculate_percentile_and_distribution,
    build_bucket_tables,
    resolve_cohort_labels
)
from app.backend.services.archetype_service import get_tested_toggle as backend_tested_toggle
from app.backend.services.progression_service import (
    calculate_wilks as backend_wilks,
    calculate_dots as backend_dots,
    score_percentile_from_table as backend_percentiles_for
)
import pandas as pd
from app.backend.config import PERCENTILE_TABLES_PATH

def test_parity_percentile_engine_vs_backend_service():
    """Verify that PercentileEngine and percentile_service produce exact identical numbers."""
    engine = PercentileEngine()
    buckets = build_bucket_tables(engine.df)

    test_cases = [
        {"lift_type": "bench", "weight_lifted": 100.0, "sex": "M", "age": 26, "bodyweight": 83.0, "tested_status": True},
        {"lift_type": "squat", "weight_lifted": 180.0, "sex": "M", "age": 25, "bodyweight": 83.0, "tested_status": None},
        {"lift_type": "deadlift", "weight_lifted": 140.0, "sex": "F", "age": 22, "bodyweight": 62.0, "tested_status": False},
        {"lift_type": "total", "weight_lifted": 500.0, "sex": "M", "age": 27, "bodyweight": 83.0, "tested_status": True},
    ]

    for tc in test_cases:
        bracket, classes = resolve_cohort_labels(buckets, tc["sex"], tc["age"], tc["bodyweight"])
        
        res_script = engine.get_percentile(
            lift_type=tc["lift_type"],
            weight_lifted=tc["weight_lifted"],
            sex=tc["sex"],
            weight_class=classes,
            age_bracket=bracket,
            tested_status=tc["tested_status"]
        )
        
        res_backend = calculate_percentile_and_distribution(
            df=engine.df,
            bucket_tables=buckets,
            sex=tc["sex"],
            age=tc["age"],
            bodyweight=tc["bodyweight"],
            lift_type=tc["lift_type"],
            weight_lifted=tc["weight_lifted"],
            tested_status=tc["tested_status"]
        )
        
        assert res_script["percentile"] == res_backend.percentile
        assert res_script["population_size"] == res_backend.population_size
        assert res_script["median_lift"] == res_backend.median_lift
        assert res_script["max_lift"] == res_backend.max_lift

def test_parity_tested_toggle():
    """Verify parity between scripts/tested_toggle.py and archetype_service.get_tested_toggle."""
    engine = PercentileEngine()
    buckets = build_bucket_tables(engine.df)

    for sex, age, bw, lift, val in [
        ("M", 27, 83.0, "total", 500.0),
        ("F", 23, 62.0, "squat", 115.0),
        ("M", 45, 93.0, "bench", 140.0),
    ]:
        res_script = script_tested_toggle(engine, buckets, sex, age, bw, lift, val)
        res_backend = backend_tested_toggle(engine.df, buckets, sex, age, bw, lift, val)

        assert res_script["age_bracket"] == res_backend.age_bracket
        assert res_script["weight_class"] == res_backend.weight_class
        assert res_script["explainer"] == res_backend.explainer
        for view_name in ["all", "tested", "untested"]:
            assert res_script["views"][view_name]["n"] == res_backend.views[view_name].n
            assert res_script["views"][view_name]["percentile"] == res_backend.views[view_name].percentile

def test_parity_wilks_dots_and_percentiles():
    """Verify parity between scripts/scoring.py, wilks_dots_toggle.py and progression_service."""
    pct_tables = pd.read_parquet(PERCENTILE_TABLES_PATH)

    for sex in ["M", "F"]:
        for bw, total in [(83.0, 500.0), (60.0, 300.0), (125.0, 750.0)]:
            w_script = script_wilks(sex, bw, total)
            w_backend = backend_wilks(sex, bw, total)
            assert round(w_script, 4) == round(w_backend, 4)

            d_script = script_dots(sex, bw, total)
            d_backend = backend_dots(sex, bw, total)
            assert round(d_script, 4) == round(d_backend, 4)

            for age in [18, 22, 27, 35, 45, 55]:
                p_script = script_percentiles_for(sex, age, w_script, d_script)
                p_backend = backend_percentiles_for(pct_tables, sex, age, w_backend, d_backend)
                assert p_script["wilks_pct"] == p_backend["wilks_pct"]
                assert p_script["dots_pct"] == p_backend["dots_pct"]
                assert p_script["n"] == p_backend["n"]

def test_parity_archetype_clustering():
    """Verify that archetype classification produces valid labels and shares matching the trained kmeans bundle."""
    import joblib
    from app.backend.services.archetype_service import classify_archetype
    from app.backend.config import KMEANS_MODEL_PATH

    bundle = joblib.load(KMEANS_MODEL_PATH)
    for sex in ["M", "F"]:
        b = bundle[sex]
        for sq, bp, dl in [
            (220.0, 100.0, 240.0),
            (140.0, 160.0, 180.0),
            (180.0, 120.0, 220.0),
        ]:
            res = classify_archetype(bundle, sex, sq, bp, dl)
            tot = sq + bp + dl
            assert res["label"] in b["labels"].values()
            assert len(res["user_shares"]) == 3
            assert round(sum(res["user_shares"]), 0) == 100
            assert round(res["user_shares"][0], 1) == round(sq / tot * 100, 1)
            assert round(res["user_shares"][1], 1) == round(bp / tot * 100, 1)
            assert round(res["user_shares"][2], 1) == round(dl / tot * 100, 1)
