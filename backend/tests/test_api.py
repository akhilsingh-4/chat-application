import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.security import create_access_token, decode_token

client = TestClient(app)


def test_health_check():
    """Test that root health endpoint returns 200 OK and status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_health_check():
    """Test that /api/health endpoint returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_not_found_route():
    """Test that requesting a non-existent route returns 404 Not Found."""
    response = client.get("/api/non-existent-route-xyz")
    assert response.status_code == 404


def test_jwt_token_generation_and_decoding():
    """Test JWT access token creation and decoding functions."""
    test_user_id = "12345678-1234-5678-1234-567812345678"
    token = create_access_token(test_user_id)
    assert isinstance(token, str)
    assert len(token) > 0

    decoded = decode_token(token)
    assert decoded.get("sub") == test_user_id
    assert decoded.get("token_type") == "access"


def test_jwt_invalid_token():
    """Test that decoding an invalid token raises a ValueError."""
    with pytest.raises(ValueError, match="Invalid or expired token"):
        decode_token("invalid.jwt.token")
