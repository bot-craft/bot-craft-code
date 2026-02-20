from flask import Blueprint, jsonify, request, send_file, after_this_request
import shutil
import tempfile
import os
import zipfile
from pathlib import Path
from config import PROJECTS_DIR
from utils.common import unpack_request
from utils.projects import get_project_list, is_chatbot_on, rename_chatbot
from models.chatbots import add_chatbot_to_collection, rename_chatbot_db, delete_chatbot_db
from utils.project_structure import create_project_structure, copy_project_structure
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
    copy_from = data.get('copy_from')  # Optional: slug of project to copy

    if not project_name or not project_name.replace('-', '').replace('_', '').isalnum():
        return jsonify({"error": "Invalid project name"}), 400
    
    project_dir = PROJECTS_DIR / project_name
    if project_dir.exists():
        return jsonify({"error": "Project already exists (either by you or by another user)"}), 409
    
    try:
        # If copy_from is provided, copy instead of creating empty structure
        if copy_from:
            source_dir = PROJECTS_DIR / copy_from
            if not source_dir.exists():
                return jsonify({"error": f"Source project '{copy_from}' not found"}), 404
            copy_project_structure(source_dir, project_dir)
        else:
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

@projects_bp.route('/api/projects/<slug>/download', methods=['GET'])
def download_project(slug):
    """Download project as zip"""
    project_dir = PROJECTS_DIR / slug
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
        
    # Create a temporary file for the zip archive
    temp_dir = tempfile.mkdtemp()
    base_name = os.path.join(temp_dir, slug)
    
    # Create the zip file
    # root_dir is the parent of project_dir, base_dir is the project folder name (slug)
    # This ensures the zip contains the folder 'slug/' and not just its contents
    shutil.make_archive(base_name, 'zip', root_dir=PROJECTS_DIR, base_dir=slug)
    zip_path = base_name + '.zip'
    
    @after_this_request
    def remove_file(response):
        try:
            os.remove(zip_path)
            os.rmdir(temp_dir)
        except Exception as error:
            print(f"Error removing temp file: {error}")
        return response

    return send_file(zip_path, as_attachment=True, download_name=f"{slug}.zip")

@projects_bp.route('/api/projects/import/validate', methods=['POST'])
def validate_import():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if not file.filename.endswith('.zip'):
            return jsonify({"error": "File must be a .zip"}), 400

        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, file.filename)
        file.save(zip_path)
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Check for single top-level directory
            # Filter entries that are likely directories or files inside a directory
            # We want to ensure everything is inside "SomeFolder/"
            all_files = zip_ref.namelist()
            if not all_files:
                return jsonify({"error": "Empty zip file"}), 400
                
            top_level_items = set()
            for name in all_files:
                # Get the first part of the path
                parts = name.split('/')
                first_part = parts[0]
                
                # If name is "folder/", split gives "folder", ""
                # If name is "file.txt", split gives "file.txt"
                if first_part != '__MACOSX': # Ignore metadata folder
                    top_level_items.add(first_part)
            
            if len(top_level_items) != 1:
                return jsonify({"error": "Zip must contain exactly one top-level directory. Please zip the project folder, not its contents."}), 400
            
            project_name = list(top_level_items)[0]
            
            # Check required subdirectories
            # The structure is now confirmed to be ProjectName/configuration etc.
            required_subdirs = ['configuration', 'log', 'tests']
            
            for subdir in required_subdirs:
                # We look for "project_name/subdir/" or "project_name/subdir/..."
                # zip paths are forward slashes
                expected_prefix = f"{project_name}/{subdir}"
                has_subdir = any(f.startswith(expected_prefix) for f in all_files)
                
                if not has_subdir:
                        shutil.rmtree(temp_dir)
                        return jsonify({"error": f"Missing required directory: {subdir}"}), 400
            
            # Check for top-level file (either top_level.yaml or top-level.yaml)
            top_level_variants = ['top_level.yaml', 'top-level.yaml']
            has_top_level = any(f == f"{project_name}/{variant}" for f in all_files for variant in top_level_variants)
            
            if not has_top_level:
                shutil.rmtree(temp_dir)
                return jsonify({"error": "Missing top_level.yaml (or top-level.yaml)"}), 400

            shutil.rmtree(temp_dir)
            return jsonify({"name": project_name})

    except zipfile.BadZipFile:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        return jsonify({"error": "Invalid zip file"}), 400
    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        return jsonify({"error": str(e)}), 500

@projects_bp.route('/api/projects/import', methods=['POST'])
def import_project():
    temp_dir = None
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        project_name = request.form.get('name')
        current_user = request.form.get('current_user')
        
        if not project_name:
            return jsonify({"error": "Project name is required"}), 400
            
        if not current_user:
            return jsonify({"error": "User not authenticated"}), 401

        project_dir = PROJECTS_DIR / project_name
        if project_dir.exists():
            return jsonify({"error": f"Project '{project_name}' already exists"}), 409

        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, file.filename)
        file.save(zip_path)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            top_level_dirs = {name.split('/')[0] for name in zip_ref.namelist() if name.split('/')[0] != '__MACOSX'}
            
            if len(top_level_dirs) != 1:
                 # This should have been caught by validate, but check again
                 return jsonify({"error": "Invalid zip structure"}), 400
                 
            original_dir_name = list(top_level_dirs)[0]
            
            zip_ref.extractall(temp_dir)
            
            original_path = os.path.join(temp_dir, original_dir_name)
            
            # If the user renamed the project in the UI, we need to rename the folder
            # The project_name variable holds the target name
            
            if not os.path.exists(original_path):
                 return jsonify({"error": "Extraction failed"}), 500
                 
            shutil.move(original_path, str(project_dir))
            
            # Ensure top_level.yaml name consistency
            top_level_hyphen = project_dir / "top-level.yaml"
            top_level_underscore = project_dir / "top_level.yaml"
            
            if top_level_hyphen.exists() and not top_level_underscore.exists():
                top_level_hyphen.rename(top_level_underscore)
            
            # Add to DB
            add_chatbot_to_collection(project_name)
            add_chatbot_to_user(current_user, project_name)
            
            return jsonify({
                "name": project_name,
                "slug": project_name,
                "active": is_chatbot_on(project_name)
            })

    except Exception as e:
        # cleanup if move failed
        # if project_dir was partially created... shutil.move is usually atomic-ish on same fs, 
        # checking if we need to cleanup project_dir
        if 'project_dir' in locals() and project_dir.exists():
             # Only delete if we suspect we created it and failed mid-way? 
             # For safety, maybe not delete automatically to avoid data loss if logic is wrong.
             # But here we just created it.
             pass
             
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

