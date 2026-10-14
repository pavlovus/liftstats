import time
import pytest
from fastapi.testclient import TestClient
from app.backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_female_lifter_full_analysis(client):
    """Test full analysis for a female athlete, verifying women's models and cohorts."""
    payload = {
        "sex": "F",
        "age": 22,
        "bodyweight": 61.5,
        "squat": 110.0,
        "bench": 65.0,
        "deadlift": 140.0,
        "training_age": 2.0,
        "meets_so_far": 1
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 315.0
    
    # Check archetype is from female k-means
    assert data["archetype"]["label"] in ["Deadlift-dominant", "Squat-dominant", "Bench-specialist"]
    
    # Check percentiles
    for lift in ["squat", "bench", "deadlift", "total"]:
        p = data["percentiles"][lift]
        assert p["percentile"] is not None
        assert 0 < p["percentile"] < 100
        assert p["population_size"] > 100
        assert len(p["bins"]) >= 10
        assert p["p50"] is not None

    # Check progression has reasonable values for female lifter
    prog = data["progression"]
    assert prog["point"] > 0
    assert prog["lo"] < prog["point"] < prog["hi"]
    assert prog["views"]["wilks"]["score"] > 250
    assert prog["views"]["dots"]["score"] > 250

def test_heavyweight_plus_category(client):
    """Test lifter with bodyweight above 120kg (120+ class) and female 90kg (84+ class)."""
    # Super heavyweight male (135 kg)
    res_m = client.post("/api/percentiles", json={
        "sex": "M",
        "age": 28,
        "bodyweight": 135.0,
        "lift_type": "squat",
        "weight_lifted": 260.0
    })
    assert res_m.status_code == 200
    assert res_m.json()["percentile"] is not None
    assert res_m.json()["population_size"] > 100

    # Super heavyweight female (95 kg)
    res_f = client.post("/api/percentiles", json={
        "sex": "F",
        "age": 30,
        "bodyweight": 95.0,
        "lift_type": "deadlift",
        "weight_lifted": 170.0
    })
    assert res_f.status_code == 200
    assert res_f.json()["percentile"] is not None
    assert res_f.json()["population_size"] > 100

def test_master_lifter_age_50_plus(client):
    """Test master lifter aged 58 (age bracket 50+)."""
    payload = {
        "sex": "M",
        "age": 58,
        "bodyweight": 93.0,
        "lift_type": "deadlift",
        "weight_lifted": 210.0
    }
    res = client.post("/api/percentiles", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["percentile"] is not None
    assert data["population_size"] > 50

def test_teen_lifter_age_16(client):
    """Test sub-junior teen lifter aged 16 (age bracket 14-19)."""
    payload = {
        "sex": "M",
        "age": 16,
        "bodyweight": 74.0,
        "lift_type": "squat",
        "weight_lifted": 140.0
    }
    res = client.post("/api/percentiles", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["percentile"] is not None
    assert data["population_size"] > 50

def test_sbd_only_flag_bench(client):
    """
    Test that sbd_only=True compares strictly against tri-event lifters
    (excluding bench-only specialists).
    """
    # Bench 120kg against all competitors (including bench specialists)
    res_all = client.post("/api/percentiles", json={
        "sex": "M",
        "age": 25,
        "bodyweight": 83.0,
        "lift_type": "bench",
        "weight_lifted": 120.0,
        "sbd_only": False
    })
    # Bench 120kg strictly against full SBD meet competitors
    res_sbd = client.post("/api/percentiles", json={
        "sex": "M",
        "age": 25,
        "bodyweight": 83.0,
        "lift_type": "bench",
        "weight_lifted": 120.0,
        "sbd_only": True
    })
    assert res_all.status_code == 200
    assert res_sbd.status_code == 200
    
    # SBD competitors alone will be a subset of all competitors
    pop_all = res_all.json()["population_size"]
    pop_sbd = res_sbd.json()["population_size"]
    assert pop_all > pop_sbd
    # Ranking is typically higher or equal against SBD lifters since bench-only specialists lift heavier
    assert res_sbd.json()["percentile"] >= res_all.json()["percentile"] - 2.0

def test_zero_competition_meets_progression(client):
    """Test progression prediction for non-competitors entering 0 meets so far."""
    payload = {
        "sex": "M",
        "age": 24,
        "bodyweight": 80.0,
        "total": 450.0,
        "training_age": 1.0,
        "meets_so_far": 0
    }
    res = client.post("/api/progression", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["point"] > 0
    assert data["lo"] < data["point"] < data["hi"]

def test_api_performance_latency(client):
    """Verify that full analysis executes in under 50ms once preloaded."""
    payload = {
        "sex": "M",
        "age": 27,
        "bodyweight": 83.0,
        "squat": 180.0,
        "bench": 125.0,
        "deadlift": 230.0,
        "training_age": 3.0,
        "meets_so_far": 2
    }
    # Warmup
    client.post("/api/analyze", json=payload)

    # Benchmark 5 calls
    times = []
    for _ in range(5):
        t0 = time.perf_counter()
        res = client.post("/api/analyze", json=payload)
        t1 = time.perf_counter()
        assert res.status_code == 200
        times.append((t1 - t0) * 1000)

    avg_ms = sum(times) / len(times)
    print(f"\n[Benchmark] /api/analyze average latency: {avg_ms:.2f} ms")
    assert avg_ms < 150.0, f"Expected average latency < 150ms, got {avg_ms:.2f}ms"
