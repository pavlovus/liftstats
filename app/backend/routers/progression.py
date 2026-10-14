from fastapi import APIRouter, Depends
import pandas as pd
from app.backend.schemas.progression import ProgressionRequest, ProgressionResponse
from app.backend.dependencies import get_progression_bundle, get_percentile_tables
from app.backend.services.progression_service import analyze_progression

router = APIRouter(tags=["Progression"])

@router.post("/progression", response_model=ProgressionResponse)
def get_progression(
    req: ProgressionRequest,
    progression_bundle: dict = Depends(get_progression_bundle),
    percentile_tables: pd.DataFrame = Depends(get_percentile_tables)
):
    return analyze_progression(
        progression_bundle=progression_bundle,
        percentile_tables_df=percentile_tables,
        sex=req.sex,
        age=req.age,
        bodyweight=req.bodyweight,
        total=req.total,
        training_age=req.training_age,
        meets_so_far=req.meets_so_far
    )
