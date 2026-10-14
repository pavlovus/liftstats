from typing import Optional, List
from pydantic import BaseModel, Field
from app.backend.schemas.common import SexType, LiftType

class PercentileRequest(BaseModel):
    sex: SexType
    age: float = Field(..., ge=14, le=100, description="Age in years (14-100)")
    bodyweight: float = Field(..., ge=30, le=250, description="Bodyweight in kg (30-250)")
    lift_type: LiftType
    weight_lifted: float = Field(..., gt=0, le=1200, description="Lift weight in kg")
    tested_status: Optional[bool] = Field(None, description="True for tested, False for untested, None for all")
    sbd_only: bool = Field(False, description="Filter to full-power SBD meets only")

class DistributionBin(BaseModel):
    weight: float
    count: int

class PercentileResponse(BaseModel):
    lift_type: LiftType
    user_weight: float
    percentile: Optional[float] = None
    population_size: int = 0
    median_lift: Optional[float] = None
    max_lift: Optional[float] = None
    p25: Optional[float] = None
    p50: Optional[float] = None
    p75: Optional[float] = None
    p90: Optional[float] = None
    bins: List[DistributionBin] = []
    error: Optional[str] = None
