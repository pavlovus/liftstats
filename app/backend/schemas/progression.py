from typing import Optional, Dict
from pydantic import BaseModel, Field
from app.backend.schemas.common import SexType

class ProgressionRequest(BaseModel):
    sex: SexType
    age: float = Field(..., ge=14, le=100, description="Age in years")
    bodyweight: float = Field(..., ge=30, le=250, description="Bodyweight in kg")
    total: float = Field(..., ge=50, le=1500, description="Total in kg")
    training_age: float = Field(..., ge=0, le=40, description="Years barbell training")
    meets_so_far: int = Field(..., ge=0, le=200, description="Competitions attended")

class ScorePercentileView(BaseModel):
    score: float
    percentile: Optional[float] = None
    n: int

class ProgressionResponse(BaseModel):
    total: float
    point: float
    lo: float
    hi: float
    views: Dict[str, ScorePercentileView]
    explainer: str
