import os
from pathlib import Path

# # MongoDB Configuration
# MONGO_URI = 'mongodb://0.0.0.0:8686'
# MONGO_URI = 'mongodb://0.0.0.0:27017'
MONGO_URI = 'mongodb://twp-taskyto-db:27017'

DB_NAME = 'taskyto-db'
CB_COLLECTION_NAME = 'chatbots'
USERS_COLLECTION_NAME = 'users'

# Directory Configuration
PROJECTS_DIR = Path('user_projects')
PROJECTS_DIR.mkdir(exist_ok=True)

# Session Configuration
SECRET_KEY = 'your-secret-key-here'  # In production, use a secure random key
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # Set to True in production

# Status Codes
ERROR = 0
SUCCESS = 1