from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from app.backend.schemas.common import SexType, LiftType

class ArchetypeRequest(BaseModel):
    sex: SexType
    age: float = Field(..., ge=14, le=100, description="Age in years")
    bodyweight: float = Field(..., ge=30, le=250, description="Bodyweight in kg")
    squat: float = Field(..., gt=0, le=700, description="Squat in kg")
    bench: float = Field(..., gt=0, le=500, description="Bench in kg")
    deadlift: float = Field(..., gt=0, le=700, description="Deadlift in kg")
    lift: LiftType = Field("total", description="Lift for tested/untested toggle")

class ToggleView(BaseModel):
    n: int
    percentile: Optional[float] = None

class TestedToggleData(BaseModel):
    lift: str
    value: float
    age_bracket: str
    weight_class: str
    views: Dict[str, ToggleView]
    explainer: str

class ArchetypeResponse(BaseModel):
    label: str
    user_shares: List[float]
    cluster_shares: List[float]
    all_clusters: Dict[str, List[float]]
    toggle: TestedToggleData
