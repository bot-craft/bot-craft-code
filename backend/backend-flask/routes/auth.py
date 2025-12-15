from flask import Blueprint, jsonify, request, session
from models.users import register_user, authenticate_user, get_user_data, update_user_settings

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        api_key = data.get('apiKey')

        # if not username or not password or not api_key:
        #     return jsonify({"error": "All fields are required"}), 400
        if not username or not password:
            return jsonify({"error": "All fields are required"}), 400

        # # Register the user
        success = register_user(username, password, api_key)
        # success = register_user(username, password)
        
        if not success:
            return jsonify({"error": "Username already exists"}), 409

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate and log in a user"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        # print("username:", username)
        # print("password:", password)

        # Authenticate the user
        user_data = authenticate_user(username, password)
        
        if not user_data:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # print("user_data:", user_data)

        # Create session
        session['username'] = username
        session.modified = True
        
        return jsonify(user_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """Log out the current user"""
    session.pop('username', None)
    return jsonify({"message": "Logged out successfully"})

@auth_bp.route('/api/auth/user', methods=['GET'])
def get_user():
    """Get the current authenticated user's data"""
    if 'username' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_data = get_user_data(session['username'])
    
    if not user_data:
        session.pop('username', None)
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user_data)

@auth_bp.route('/api/auth/settings', methods=['PUT'])
def update_settings():
    """Update user settings"""
    if 'username' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        data = request.json
        new_username = data.get('username')
        new_password = data.get('password')
        new_api_key = data.get('apiKey')
        current_username = session['username']

        # Update user settings
        success = update_user_settings(
            current_username, 
            new_username, 
            new_password, 
            new_api_key
        )
        
        if not success:
            return jsonify({"error": "Failed to update settings"}), 400
            
        # If username was changed, update session
        if new_username and new_username != current_username:
            session['username'] = new_username

        return jsonify({"message": "Settings updated successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500