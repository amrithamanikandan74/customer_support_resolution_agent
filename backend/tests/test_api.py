from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Customer Support Resolution Agent is running"}


def test_resolve_endpoint():
    payload = {
        "incident_text": "I can't log in to my account",
        "user_name": "Test User"
    }
    response = client.post("/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "response" in data
    assert "retrieved_articles" in data
    assert data["user_name"] == "Test User"
