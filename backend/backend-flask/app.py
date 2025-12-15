import os
from flask import Flask
from flask_cors import CORS
from utils.db_init import initialize_database
from config import SECRET_KEY, SESSION_COOKIE_SAMESITE, SESSION_COOKIE_SECURE

# Import route blueprints
from routes.projects import projects_bp
from routes.files import files_bp
from routes.modules import modules_bp
from routes.conversations import conversations_bp
from routes.auth import auth_bp

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configure CORS to allow credentials
    CORS(app, supports_credentials=True)

    # Configure session
    app.secret_key = SECRET_KEY
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' # 'Lax' es un buen valor por defecto
    app.config['SESSION_COOKIE_SECURE'] = False # Cambia a False para desarrollo con HTTP
    
    # Register blueprints
    app.register_blueprint(projects_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(modules_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(auth_bp)
    
    return app

if __name__ == '__main__':
    # Initialize the database
    initialize_database()
    
    # Create the application
    app = create_app()
    
    # Run the application
    debug_mode = os.environ.get('DEBUG_MODE', 'False').lower() in ('true', '1', 't')
    app.run(host='0.0.0.0', port=7000, debug=debug_mode)