from fastapi import APIRouter, Depends
import pandas as pd
from app.backend.schemas.full_analysis import FullAnalysisRequest, FullAnalysisResponse
from app.backend.dependencies import (
    get_df,
    get_bucket_tables,
    get_kmeans_bundle,
    get_progression_bundle,
    get_percentile_tables,
    get_cohort_partitions
)
from app.backend.services.percentile_service import (
    calculate_percentile_and_distribution,
    get_demographic_cohort
)
from app.backend.services.archetype_service import analyze_archetype
from app.backend.services.progression_service import analyze_progression

router = APIRouter(tags=["Full Analysis"])

@router.post("/analyze", response_model=FullAnalysisResponse)
@router.post("/analyze/full", response_model=FullAnalysisResponse)
def analyze_all(
    req: FullAnalysisRequest,
    df: pd.DataFrame = Depends(get_df),
    bucket_tables: dict = Depends(get_bucket_tables),
    kmeans_bundle: dict = Depends(get_kmeans_bundle),
    progression_bundle: dict = Depends(get_progression_bundle),
    percentile_tables: pd.DataFrame = Depends(get_percentile_tables),
    cohort_partitions: dict = Depends(get_cohort_partitions)
):
    total = req.squat + req.bench + req.deadlift
    
    # Pre-filter demographic cohort once (massive performance speedup)
    cohort_df, bracket, classes = get_demographic_cohort(
        df=df,
        bucket_tables=bucket_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        cohort_partitions=cohort_partitions
    )

    # 1. Calculate percentiles for each lift + total using the pre-filtered cohort
    percentiles_dict = {}
    for lift, weight in [
        ("squat", req.squat),
        ("bench", req.bench),
        ("deadlift", req.deadlift),
        ("total", total)
    ]:
        percentiles_dict[lift] = calculate_percentile_and_distribution(
            df=df,
            bucket_tables=bucket_tables,
            sex=req.sex,
            age=req.age,
            bodyweight=req.bodyweight,
            lift_type=lift,
            weight_lifted=weight,
            tested_status=req.tested_status,
            sbd_only=req.sbd_only,
            cohort_df=cohort_df
        )

    # 2. Archetype analysis using the pre-filtered cohort
    archetype_res = analyze_archetype(
        kmeans_bundle=kmeans_bundle,
        df=df,
        bucket_tables=bucket_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        squat=req.squat,
        bench=req.bench,
        deadlift=req.deadlift,
        lift="total",
        cohort_df=cohort_df,
        bracket=bracket,
        classes=classes
    )

    # 3. Progression analysis
    progression_res = analyze_progression(
        progression_bundle=progression_bundle,
        percentile_tables_df=percentile_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        total=total,
        training_age=req.training_age,
        meets_so_far=req.meets_so_far
    )

    return FullAnalysisResponse(
        total=round(float(total), 1),
        percentiles=percentiles_dict,
        archetype=archetype_res,
        progression=progression_res
    )
