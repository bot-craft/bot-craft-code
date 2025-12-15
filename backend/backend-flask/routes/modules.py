from flask import Blueprint, jsonify, request
from pathlib import Path
import yaml
from config import PROJECTS_DIR
from utils.common import unpack_request

modules_bp = Blueprint('modules', __name__)

@modules_bp.route('/api/projects/<slug>/modules', methods=['POST'])
def create_module(slug: str):
    """Create a new module based on a template"""
    if not (data := unpack_request(request)):
        return jsonify({"error": "Error unpacking the request"}), 400

    module_name: str = data.get('name')
    module_type: str = data.get('type')
    module_path: str = data.get('path', '')

    if not module_name or not module_type:
        return jsonify({"error": "Module name and type are required"}), 400

    # Mapping of module types to template files
    module_templates: dict[str, str] = {
        'action': 'action_template.yaml',
        'data_gathering': 'data_gathering_template.yaml',
        'question_answering': 'question_answering_template.yaml',
        'menu': 'top_level_template.yaml'
    }

    if module_type not in module_templates:
        return jsonify({"error": "Invalid module type"}), 400

    project_dir = PROJECTS_DIR / slug
    template_path = Path('project_templates') / module_templates[module_type]

    # Build the complete path
    target_dir = project_dir / module_path.lstrip('/') if module_path else project_dir
    target_dir.mkdir(parents=True, exist_ok=True)  # Create directories if they don't exist
    
    if not project_dir.exists():
        return jsonify({"error": "Project not found"}), 404

    if not template_path.exists():
        return jsonify({"error": "Module template not found"}), 500

    try:
        # Read the template content
        with open(template_path, 'r') as f:
            template_content = f.read()
            
        # Parse the YAML content
        yaml_content = yaml.safe_load(template_content)
        
        # Update the name field
        yaml_content['name'] = module_name
        
        # Convert back to YAML string preserving the style
        updated_content = yaml.dump(yaml_content, 
                                default_flow_style=False, 
                                sort_keys=False,
                                allow_unicode=True,
                                width=float("inf"))
        
        # Create the full file path
        yaml_filename = f"{module_name}.yaml"
        full_path = target_dir / yaml_filename

        # Write the modified content to the new file
        with open(full_path, 'w') as f:
            f.write(updated_content)

        return jsonify({
            "message": "Module created successfully",
            "path": str(full_path.relative_to(project_dir))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500