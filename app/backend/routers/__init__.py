from app.backend.routers.health import router as health_router
from app.backend.routers.percentiles import router as percentiles_router
from app.backend.routers.archetypes import router as archetypes_router
from app.backend.routers.progression import router as progression_router
from app.backend.routers.analyze import router as analyze_router

__all__ = [
    "health_router",
    "percentiles_router",
    "archetypes_router",
    "progression_router",
    "analyze_router",
]
