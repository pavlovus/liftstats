from fastapi import APIRouter, Depends
import pandas as pd
from app.backend.schemas.percentiles import PercentileRequest, PercentileResponse
from app.backend.dependencies import get_df, get_bucket_tables, get_cohort_partitions
from app.backend.services.percentile_service import (
    calculate_percentile_and_distribution,
    get_demographic_cohort
)

router = APIRouter(tags=["Percentiles"])

@router.post("/percentiles", response_model=PercentileResponse)
def get_percentiles(
    req: PercentileRequest,
    df: pd.DataFrame = Depends(get_df),
    bucket_tables: dict = Depends(get_bucket_tables),
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
    return calculate_percentile_and_distribution(
        df=df,
        bucket_tables=bucket_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        lift_type=req.lift_type,
        weight_lifted=req.weight_lifted,
        tested_status=req.tested_status,
        sbd_only=req.sbd_only,
        cohort_df=cohort_df
    )
