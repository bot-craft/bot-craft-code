# Bot-Craft - Flask Backend

This is the Flask backend for the Bot-Craft. The application follows a modular structure to improve maintainability and scalability.

## Project Structure

```
backend-flask/
├── app.py                  # Main application entry point
├── config.py               # Configuration settings
├── extensions.py           # Shared extensions (MongoDB client)
├── models/                 # Data models
│   ├── __init__.py
│   ├── chatbots.py         # Chatbot-related database operations
│   └── users.py            # User-related database operations
├── routes/                 # API endpoints
│   ├── __init__.py
│   ├── auth.py             # Authentication routes
│   ├── conversations.py    # Conversation management routes
│   ├── files.py            # File management routes
│   ├── modules.py          # Module management routes
│   └── projects.py         # Project management routes
├── templates/              # Template generators
│   └── project_structure.py # Project structure template
├── utils/                  # Utility functions
│   ├── __init__.py
│   ├── common.py           # Common utility functions
│   ├── db_init.py          # Database initialization
│   ├── encryption.py       # Encryption utilities
│   └── projects.py         # Project management utilities
└── requirements.txt        # Package dependencies
```

## Setup

1. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Run the application:
```
python app.py
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `PUT /api/projects/<slug>` - Rename a project
- `DELETE /api/projects/<slug>` - Delete a project

### Files
- `GET /api/projects/<slug>/files` - List files in a project
- `POST /api/projects/<slug>/files` - Create a file/directory
- `PUT /api/projects/<slug>/files/rename` - Rename a file/directory
- `DELETE /api/projects/<slug>/files/<path:file_path>/delete` - Delete a file/directory
- `GET /api/projects/<slug>/files/<path:file_path>/get` - Get file content
- `PUT /api/projects/<slug>/files/<path:file_path>/update` - Update file content

### Modules
- `POST /api/projects/<slug>/modules` - Create a new module

### Conversations
- `GET /api/conversations/<chatbot_slug>` - Get conversation list
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/<chatbot_slug>/<conversation_name>/messages` - Get conversation messages
- `POST /api/conversations/<chatbot_slug>/<conversation_name>/messages` - Add message to conversation
- `PUT /api/conversations/<chatbot_slug>/mark-dead` - Mark conversations as dead

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user
- `PUT /api/auth/settings` - Update user settings