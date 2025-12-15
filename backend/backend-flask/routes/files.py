from flask import Blueprint, jsonify, request
from pathlib import Path
from config import PROJECTS_DIR
from utils.common import unpack_request
import shutil

files_bp = Blueprint('files', __name__)

@files_bp.route('/api/projects/<slug>/files', methods=['GET'])
def list_files(slug):
    """List all files and directories of a project"""
    project_dir = PROJECTS_DIR / slug
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
        
    def get_file_tree(path):
        if path.is_file():
            return {
                "name": path.name,
                "type": "file",
                "path": str(path.relative_to(project_dir))
            }
        else:
            return {
                "name": path.name,
                "type": "directory",
                "path": str(path.relative_to(project_dir)),
                "children": [
                    get_file_tree(child) 
                    for child in sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name))
                ]
            }
    
    return jsonify([get_file_tree(project_dir)])

@files_bp.route('/api/projects/<slug>/files', methods=['POST'])
def create_file(slug):
    """Create a new file or directory"""
    if not (data := unpack_request(request)):
        return jsonify({"error": "create_file: Error unpacking the request"}), 400

    file_path = data.get('path')
    file_type = data.get('type')  # 'file' or 'directory'
    content = data.get('content', '')  # Only for files
    
    if not file_path:
        return jsonify({"error": "Path is required"}), 400
        
    project_dir = PROJECTS_DIR / slug
    full_path = project_dir / file_path.lstrip('/')
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
    if full_path.exists():
        return jsonify({"error": "File already exists"}), 409
        
    try:
        if file_type == 'directory':
            full_path.mkdir(parents=True)
        else:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            
        return jsonify({
            "name": full_path.name,
            "type": file_type,
            "path": file_path
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@files_bp.route('/api/projects/<slug>/files/rename', methods=['PUT'])
def rename_file(slug):
    """Rename a file or directory"""
    if not (data := unpack_request(request)):
        return jsonify({"error": "rename_file: Error unpacking the request"}), 400

    old_path = data.get('oldPath')
    new_path = data.get('newPath')
    
    if not new_path:
        return jsonify({"error": "New path is required"}), 400
        
    project_dir = PROJECTS_DIR / slug
    old_full_path = project_dir / old_path
    new_full_path = project_dir / new_path.lstrip('/')

    # Additional validations
    if not old_full_path.exists():
        return jsonify({"error": "Original path does not exist"}), 404

    # Validate not moving to itself
    if new_full_path == old_full_path:
        return jsonify({"error": "New path is same as old path"}), 400
    
    # Create parent directories if they don't exist
    new_full_path.parent.mkdir(parents=True, exist_ok=True)
        
    try:
        old_full_path.rename(new_full_path)
        return jsonify({
            "newPath": str(new_full_path.relative_to(project_dir))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@files_bp.route('/api/projects/<slug>/files/<path:file_path>/delete', methods=['DELETE'])
def delete_file(slug, file_path):
    """Delete a file or directory"""
    project_dir = PROJECTS_DIR / slug
    full_path = project_dir / file_path
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
    if not full_path.exists():
        return jsonify({"error": "File not found"}), 404
        
    try:
        if full_path.is_dir():
            shutil.rmtree(full_path)
        else:
            full_path.unlink()
        return jsonify({"message": "File deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@files_bp.route('/api/projects/<slug>/files/<path:file_path>/get', methods=['GET'])
def get_file_content(slug, file_path):
    """Get the content of a file"""
    project_dir = PROJECTS_DIR / slug
    full_path = project_dir / file_path
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
    if not full_path.exists() or full_path.is_dir():
        return jsonify({"error": "File not found"}), 404
        
    try:
        content = full_path.read_text()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@files_bp.route('/api/projects/<slug>/files/<path:file_path>/update', methods=['PUT'])
def update_file_content(slug, file_path):
    """Update the content of a file"""
    project_dir = PROJECTS_DIR / slug
    full_path = project_dir / file_path
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404
    if not full_path.exists() or full_path.is_dir():
        return jsonify({"error": "File not found"}), 404
        
    try:
        if not (body_dict := unpack_request(request)):
            return jsonify({"error": "update_file_content: Error unpacking the request"}), 400

        new_content = body_dict.get('content', '')
        full_path.write_text(new_content)

        return jsonify({"message": "File updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500