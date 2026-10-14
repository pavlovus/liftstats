from fastapi import APIRouter, Depends
import pandas as pd
from app.backend.schemas.archetypes import ArchetypeRequest, ArchetypeResponse
from app.backend.dependencies import (
    get_df,
    get_bucket_tables,
    get_kmeans_bundle,
    get_cohort_partitions
)
from app.backend.services.archetype_service import analyze_archetype
from app.backend.services.percentile_service import get_demographic_cohort

router = APIRouter(tags=["Archetypes"])

@router.post("/archetype", response_model=ArchetypeResponse)
def get_archetype(
    req: ArchetypeRequest,
    df: pd.DataFrame = Depends(get_df),
    bucket_tables: dict = Depends(get_bucket_tables),
    kmeans_bundle: dict = Depends(get_kmeans_bundle),
    cohort_partitions: dict = Depends(get_cohort_partitions)
):
    cohort_df, bracket, classes = get_demographic_cohort(
        df=df,
        bucket_tables=bucket_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        cohort_partitions=cohort_partitions
    )
    return analyze_archetype(
        kmeans_bundle=kmeans_bundle,
        df=df,
        bucket_tables=bucket_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        squat=req.squat,
        bench=req.bench,
        deadlift=req.deadlift,
        lift=req.lift,
        cohort_df=cohort_df,
        bracket=bracket,
        classes=classes
    )
