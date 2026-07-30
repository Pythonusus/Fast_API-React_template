"""
Entry point script for backend application.

Runs the FastAPI application using Uvicorn.
"""

import uvicorn

from app.api import app


# Run the FastAPI application using Uvicorn.
def main():
    # host="0.0.0.0" means listen on all network interfaces.
    # It is correct default for containerized applications, so app
    # could be reached from the outside of the container.
    uvicorn.run(app, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
