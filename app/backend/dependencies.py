from fastapi import Request
import pandas as pd

def get_df(request: Request) -> pd.DataFrame:
    return request.app.state.df

def get_bucket_tables(request: Request) -> dict:
    return request.app.state.bucket_tables

def get_kmeans_bundle(request: Request) -> dict:
    return request.app.state.kmeans_bundle

def get_progression_bundle(request: Request) -> dict:
    return request.app.state.progression_bundle

def get_percentile_tables(request: Request) -> pd.DataFrame:
    return request.app.state.percentile_tables

def get_cohort_partitions(request: Request) -> dict:
    return request.app.state.cohort_partitions
