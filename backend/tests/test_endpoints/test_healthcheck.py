from app.settings import APP_TITLE


def test_healthcheck(client):
    response = client.get("/api/health")

    assert response.status_code == 200

    assert response.json() == {"message": f"{APP_TITLE} is up and running"}
