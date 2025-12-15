from flask import Blueprint, jsonify, request
import shutil
from config import PROJECTS_DIR
from utils.common import unpack_request
from utils.projects import get_project_list, is_chatbot_on, rename_chatbot
from models.chatbots import add_chatbot_to_collection, rename_chatbot_db, delete_chatbot_db
from utils.project_structure import create_project_structure
from models.users import add_chatbot_to_user, rename_or_delete_chatbot_to_user

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/list_projects', methods=['POST'])
# @projects_bp.route('/api/list_projects', methods=['GET'])
def list_projects():
    """List all projects"""
    # Pending to get the owners of the chatbots (add this field to the DB)
    data = request.json
    current_user = data.get('current_user')
    if not current_user:
        return jsonify({"error": "User not authenticated"}), 401
    
    return jsonify(get_project_list(current_user))

@projects_bp.route('/api/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    data = request.json
    project_name = data.get('name')
    current_user = data.get('current_user')
    
    if not project_name or not project_name.replace('-', '').replace('_', '').isalnum():
        return jsonify({"error": "Invalid project name"}), 400
    
    project_dir = PROJECTS_DIR / project_name
    if project_dir.exists():
        return jsonify({"error": "Project already exists (either by you or by another user)"}), 409
    
    try:
        project_dir.mkdir()
        create_project_structure(project_dir)
        
        # Add the chatbot to the DB
        response = add_chatbot_to_collection(project_name)
        
        add_chatbot_to_user(current_user, project_name)

        return jsonify({
            "name": project_name,
            "slug": project_name,
            "active": is_chatbot_on(project_name)
        })
    
    except Exception as e:
        if project_dir.exists():
            import shutil
            shutil.rmtree(project_dir)

        return jsonify({"error": f"Error creating project: {str(e)}"}), 500

@projects_bp.route('/api/projects/<slug>', methods=['PUT'])
def rename_project(slug):
    """Rename an existing project"""
    data = request.json
    new_name = data.get('name')
    current_user = data.get('current_user')
    
    if not new_name or not new_name.replace('-', '').replace('_', '').isalnum():
        return jsonify({"error": "Invalid project name"}), 400
        
    old_project_dir = PROJECTS_DIR / slug
    new_project_dir = PROJECTS_DIR / new_name
    
    if not old_project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
    if new_project_dir.exists():
        return jsonify({"error": "New project name already exists (either by you or by another user)"}), 409
        
    old_project_dir.rename(new_project_dir)

    # Rename chatbot in chatbot API
    rename_chatbot(slug, new_name)

    # Rename chatbot in DB
    rename_chatbot_db(slug, new_name)
    rename_or_delete_chatbot_to_user(current_user, slug, new_name)
     
    return jsonify({
        "name": new_name,
        "slug": new_name,
        "active": is_chatbot_on(new_name)
    })

@projects_bp.route('/api/projects/delete', methods=['POST'])
def delete_project():
    """Delete an existing project"""
    data = request.json
    
    current_user = data.get('current_user')
    chatbot_to_delete = data.get('chatbot_to_delete')
    
    project_dir = PROJECTS_DIR / chatbot_to_delete
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
    
    # Delete the chatbot from the DB
    delete_chatbot_db(chatbot_to_delete)
    rename_or_delete_chatbot_to_user(current_user, chatbot_to_delete)
        
    shutil.rmtree(project_dir)
    return jsonify({"message": "Project deleted successfully"})