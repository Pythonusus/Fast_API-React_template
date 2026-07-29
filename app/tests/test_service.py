from app.service import world


def test_world():
    assert world() == "World!"
