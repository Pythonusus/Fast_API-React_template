"""
Backend application settings.

Check the .env.example file in the root directory for more information.
"""

import os

from dotenv import load_dotenv

load_dotenv()


APP_TITLE = "Fast_API-React_template"

# Mode in which the application is running [OPTIONAL]
# If DEVELOPMENT is not set, it defaults to false
DEVELOPMENT = os.getenv("DEVELOPMENT", "false").lower() == "true"

# Database URL [REQUIRED]
DATABASE_URL = os.getenv("DATABASE_URL")
