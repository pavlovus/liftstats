import pytest
from fastapi.testclient import TestClient

# The test imports the app from app.main.
# Before implementation, this will fail (RED in TDD).
from app.backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "records_loaded" in data

def test_percentiles_endpoint(client):
    payload = {
        "sex": "M",
        "age": 26,
        "bodyweight": 83.0,
        "lift_type": "bench",
        "weight_lifted": 120.0
    }
    response = client.post("/api/percentiles", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["percentile"] <= 100
    assert data["population_size"] > 1000
    assert data["median_lift"] > 0
    assert "bins" in data
    assert len(data["bins"]) >= 10
    assert "p25" in data and "p50" in data and "p75" in data and "p90" in data

def test_archetype_endpoint(client):
    payload = {
        "sex": "M",
        "age": 27,
        "bodyweight": 83.0,
        "squat": 180.0,
        "bench": 120.0,
        "deadlift": 220.0,
        "lift": "total"
    }
    response = client.post("/api/archetype", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "label" in data
    assert data["label"] in ["Deadlift-dominant", "Squat-dominant", "Bench-specialist"]
    assert "user_shares" in data and len(data["user_shares"]) == 3
    assert "toggle" in data
    assert "all" in data["toggle"]["views"]
    assert "tested" in data["toggle"]["views"]
    assert "untested" in data["toggle"]["views"]

def test_progression_endpoint(client):
    payload = {
        "sex": "M",
        "age": 25,
        "bodyweight": 83.0,
        "total": 520.0,
        "training_age": 2.0,
        "meets_so_far": 1
    }
    response = client.post("/api/progression", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "point" in data
    assert data["lo"] <= data["point"] <= data["hi"]
    assert "wilks" in data["views"] and "dots" in data["views"]
    assert data["views"]["wilks"]["percentile"] is not None
    assert data["views"]["dots"]["percentile"] is not None

def test_full_analysis_endpoint(client):
    payload = {
        "sex": "M",
        "age": 26,
        "bodyweight": 82.5,
        "squat": 175.0,
        "bench": 120.0,
        "deadlift": 215.0,
        "training_age": 2.5,
        "meets_so_far": 1
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "percentiles" in data
    assert "archetype" in data
    assert "progression" in data
    # Check that individual lifts have percentiles
    assert "squat" in data["percentiles"]
    assert "bench" in data["percentiles"]
    assert "deadlift" in data["percentiles"]
    assert "total" in data["percentiles"]

    # Test that /api/analyze/full alias works identically
    res_full = client.post("/api/analyze/full", json=payload)
    assert res_full.status_code == 200
    assert res_full.json()["total"] == data["total"]

def test_validation_errors(client):
    # Age too low (< 14)
    res1 = client.post("/api/percentiles", json={
        "sex": "M", "age": 10, "bodyweight": 80.0, "lift_type": "bench", "weight_lifted": 100.0
    })
    assert res1.status_code == 422

    # Weight lifted negative
    res2 = client.post("/api/percentiles", json={
        "sex": "M", "age": 25, "bodyweight": 80.0, "lift_type": "bench", "weight_lifted": -50.0
    })
    assert res2.status_code == 422

    # Invalid sex
    res3 = client.post("/api/percentiles", json={
        "sex": "X", "age": 25, "bodyweight": 80.0, "lift_type": "bench", "weight_lifted": 100.0
    })
    assert res3.status_code == 422

def test_frontend_spa_serving(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "LiftStats" in response.text
    assert "Martian+Mono" in response.text
    assert "Onest" in response.text

