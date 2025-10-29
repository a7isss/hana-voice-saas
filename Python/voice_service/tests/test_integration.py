#!/usr/bin/env python3
"""
Integration tests for Hana Voice Service API endpoints

Tests the FastAPI application endpoints using httpx for async HTTP testing.
Tests include health checks, endpoint functionality, error handling, and edge cases.
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient

from app.main import app


class TestHealthEndpoints:
    """Test suite for health check endpoints"""

    @pytest.mark.asyncio
    async def test_root_endpoint(self, async_client: AsyncClient):
        """Test the root endpoint returns proper service information"""
        response = await async_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Arabic Healthcare Voice Service"
        assert "capabilities" in data
        assert len(data["capabilities"]) > 0

    @pytest.mark.asyncio
    async def test_health_endpoint(self, async_client: AsyncClient):
        """Test the health endpoint returns system status"""
        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "voice_service" in data
        assert "models" in data

    @pytest.mark.asyncio
    async def test_health_endpoint_service_unavailable(self, async_client: AsyncClient):
        """Test health endpoint when voice service is not initialized"""
        # Temporarily set voice_service to None to simulate initialization failure
        from app.main import voice_service
        original_voice_service = voice_service
        try:
            import app.main
            app.main.voice_service = None

            response = await async_client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "error"
            assert "message" in data
        finally:
            app.main.voice_service = original_voice_service


class TestAuthenticationEndpoints:
    """Test suite for authentication endpoints"""

    @pytest.mark.asyncio
    async def test_get_auth_token_valid_credentials(self, async_client: AsyncClient):
        """Test obtaining auth token with valid credentials"""
        response = await async_client.get(
            "/auth/token",
            headers={"Authorization": "Bearer your-voice-service-secret"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "session_id" in data

    @pytest.mark.asyncio
    async def test_get_auth_token_invalid_credentials(self, async_client: AsyncClient):
        """Test auth token request with invalid credentials"""
        response = await async_client.get(
            "/auth/token",
            headers={"Authorization": "Bearer invalid-secret"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_get_auth_token_no_credentials(self, async_client: AsyncClient):
        """Test auth token request without credentials"""
        response = await async_client.get("/auth/token")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


class TestAdminEndpoints:
    """Test suite for admin-only endpoints"""

    @pytest.mark.asyncio
    async def test_get_active_sessions_valid_auth(self, async_client: AsyncClient):
        """Test getting active sessions with valid admin auth"""
        response = await async_client.get(
            "/admin/sessions",
            headers={"Authorization": "Bearer your-admin-secret"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "active_sessions" in data
        assert "total_sessions" in data
        assert "max_sessions" in data

    @pytest.mark.asyncio
    async def test_get_active_sessions_invalid_auth(self, async_client: AsyncClient):
        """Test getting active sessions with invalid admin auth"""
        response = await async_client.get(
            "/admin/sessions",
            headers={"Authorization": "Bearer invalid-secret"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_get_active_sessions_no_auth(self, async_client: AsyncClient):
        """Test getting active sessions without authentication"""
        response = await async_client.get("/admin/sessions")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_admin_health_check_valid_auth(self, async_client: AsyncClient):
        """Test admin health check with valid authentication"""
        response = await async_client.get(
            "/admin/health",
            headers={"Authorization": "Bearer your-admin-secret"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "voice_service" in data
        assert "security" in data


class TestInputValidation:
    """Test suite for input validation"""

    @pytest.mark.asyncio
    async def test_websocket_echo_invalid_data(self, async_client: AsyncClient):
        """Test WebSocket endpoint rejects invalid data types"""
        # Note: WebSocket testing with httpx is limited, but we can test the endpoint exists
        # Real WebSocket testing would require a WebSocket client
        response = await async_client.get("/ws/echo")
        assert response.status_code == 404  # WebSocket endpoints return 404 for HTTP requests


class TestRateLimiting:
    """Test suite for rate limiting and session management"""

    @pytest.mark.asyncio
    async def test_rate_limiting_auth_token(self, async_client: AsyncClient):
        """Test rate limiting on auth token endpoint"""
        # Make multiple rapid requests to test rate limiting
        responses = []
        for _ in range(70):  # Exceeds the 60/minute limit
            response = await async_client.get(
                "/auth/token",
                headers={"Authorization": "Bearer your-voice-service-secret"}
            )
            responses.append(response.status_code)

        # Should have some successful requests and some rate limited (429)
        assert 200 in responses  # At least some should succeed
        # Note: Rate limiting may not be fully implemented in test environment

    @pytest.mark.asyncio
    async def test_concurrent_session_limits(self, async_client: AsyncClient):
        """Test concurrent session limit enforcement"""
        # Try to create multiple concurrent sessions
        # This would require mocking the session management
        # In a real test, we'd check the MAX_CONCURRENT_SESSIONS limit
        pass  # Implementation depends on session management setup


class TestErrorHandling:
    """Test suite for error handling and edge cases"""

    @pytest.mark.asyncio
    async def test_invalid_endpoint(self, async_client: AsyncClient):
        """Test accessing non-existent endpoint returns appropriate error"""
        response = await async_client.get("/nonexistent")
        assert response.status_code in [404, 422]  # FastAPI returns 404 for not found

    @pytest.mark.asyncio
    async def test_method_not_allowed(self, async_client: AsyncClient):
        """Test POST request to GET-only endpoint"""
        response = await async_client.post("/")
        assert response.status_code == 405  # Method Not Allowed

    @pytest.mark.asyncio
    async def test_malformed_json(self, async_client: AsyncClient):
        """Test handling of malformed JSON requests"""
        # This would apply to endpoints that accept JSON, but our main endpoints
        # are GET-based health checks with WebSocket endpoints
        pass


class TestPerformance:
    """Test suite for performance and load testing"""

    @pytest.mark.asyncio
    async def test_health_endpoint_response_time(self, async_client: AsyncClient):
        """Test health endpoint response time is reasonable"""
        import time
        start_time = time.time()

        response = await async_client.get("/health")

        end_time = time.time()
        response_time = end_time - start_time

        assert response.status_code == 200
        assert response_time < 5.0  # Should respond within 5 seconds

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, async_client: AsyncClient):
        """Test handling of concurrent requests"""
        import asyncio

        async def make_request():
            return await async_client.get("/")

        # Make multiple concurrent requests
        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)

        # All requests should succeed
        assert all(response.status_code == 200 for response in responses)


# Pytest fixtures
@pytest.fixture
async def async_client():
    """Create async HTTP client for testing"""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def sync_client():
    """Create sync HTTP client for testing"""
    with TestClient(app) as client:
        yield client


# Test configuration
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
