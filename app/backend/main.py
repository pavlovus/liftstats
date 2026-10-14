import pickle
from contextlib import asynccontextmanager
import joblib
import pandas as pd
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.backend.config import (
    PARQUET_DATA_PATH,
    CSV_DATA_PATH,
    PERCENTILE_TABLES_PATH,
    KMEANS_MODEL_PATH,
    PROGRESSION_MODEL_PATH,
)
from app.backend.services.percentile_service import build_bucket_tables
from app.backend.routers import (
    health_router,
    percentiles_router,
    archetypes_router,
    progression_router,
    analyze_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager: preloads dataset, bucket tables, and trained ML models
    into application state once at startup. Ensures sub-15ms response times.
    """
    print("[Lifespan] Starting LiftStats Backend...")

    # 1. Load clean competition dataset (Parquet preferred for speed & memory)
    data_path = PARQUET_DATA_PATH if PARQUET_DATA_PATH.exists() else CSV_DATA_PATH
    print(f"[Lifespan] Loading dataset from {data_path}...")
    if str(data_path).endswith(".parquet"):
        df = pd.read_parquet(data_path)
    else:
        df = pd.read_csv(data_path, low_memory=False)

    df["weight_class"] = df["weight_class"].astype(str)
    app.state.df = df
    print(f"[Lifespan] Dataset loaded: {len(df):,} records in memory.")

    # 2. Build bucket tables for quick age and weight-class resolution
    print("[Lifespan] Building bucket lookup tables...")
    app.state.bucket_tables = build_bucket_tables(df)

    # 3. Load k-means archetype clustering bundle
    print(f"[Lifespan] Loading archetype model from {KMEANS_MODEL_PATH}...")
    app.state.kmeans_bundle = joblib.load(KMEANS_MODEL_PATH)

    # 4. Load progression regression model
    print(f"[Lifespan] Loading progression model from {PROGRESSION_MODEL_PATH}...")
    with open(PROGRESSION_MODEL_PATH, "rb") as f:
        app.state.progression_bundle = pickle.load(f)

    # 5. Load precomputed Wilks & DOTS percentile tables
    print(f"[Lifespan] Loading percentile tables from {PERCENTILE_TABLES_PATH}...")
    app.state.percentile_tables = pd.read_parquet(PERCENTILE_TABLES_PATH)

    # 6. Pre-partition dataset by (sex, age_bracket) for sub-10ms demographic queries
    print("[Lifespan] Pre-partitioning dataset by (sex, age_bracket)...")
    app.state.cohort_partitions = {
        (str(s), str(b)): grp
        for (s, b), grp in df.groupby(["sex", "age_bracket"], observed=True)
    }

    print("[Lifespan] LiftStats Backend is ready!")
    yield
    print("[Lifespan] Shutting down LiftStats Backend...")

app = FastAPI(
    title="LiftStats API",
    description="Statistical Exploration and Powerlifting Percentile Benchmarking API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for local React / Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(percentiles_router, prefix="/api")
app.include_router(archetypes_router, prefix="/api")
app.include_router(progression_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")

# Mount static frontend build if it exists
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "build" / "client"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
