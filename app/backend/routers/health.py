from fastapi import APIRouter, Depends
import pandas as pd
from app.backend.dependencies import get_df

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(df: pd.DataFrame = Depends(get_df)):
    return {
        "status": "ok",
        "records_loaded": len(df)
    }
