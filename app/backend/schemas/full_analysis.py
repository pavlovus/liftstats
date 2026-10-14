from typing import Optional, Dict
from pydantic import BaseModel, Field
from app.backend.schemas.common import SexType
from app.backend.schemas.percentiles import PercentileResponse
from app.backend.schemas.archetypes import ArchetypeResponse
from app.backend.schemas.progression import ProgressionResponse

class FullAnalysisRequest(BaseModel):
    sex: SexType
    age: float = Field(..., ge=14, le=100, description="Age in years")
    bodyweight: float = Field(..., ge=30, le=250, description="Bodyweight in kg")
    squat: float = Field(..., gt=0, le=700, description="Squat in kg")
    bench: float = Field(..., gt=0, le=500, description="Bench in kg")
    deadlift: float = Field(..., gt=0, le=700, description="Deadlift in kg")
    training_age: float = Field(default=1.0, ge=0, le=40, description="Years barbell training")
    meets_so_far: int = Field(default=0, ge=0, le=200, description="Competitions attended")
    tested_status: Optional[bool] = Field(None, description="True for tested, False for untested, None for all")
    sbd_only: bool = Field(False, description="Filter to full-power SBD meets only")

class FullAnalysisResponse(BaseModel):
    total: float
    percentiles: Dict[str, PercentileResponse]
    archetype: ArchetypeResponse
    progression: ProgressionResponse
