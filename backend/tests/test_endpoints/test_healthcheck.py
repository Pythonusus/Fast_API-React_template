from app.settings import settings


def test_healthcheck(client):
    response = client.get("/api/health")

    assert response.status_code == 200

    assert response.json() == {
        "message": f"{settings.app_title} is up and running"
    }
