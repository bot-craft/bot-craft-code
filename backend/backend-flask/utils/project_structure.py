# templates/project_structure.py

from pathlib import Path

PROJECT_TEMPLATES = {
    'dirs': [
        'configuration',
        'log',
        'tests'
    ],
    'files': {
        'configuration/default.yaml': 'project_templates/default_template.yaml',
        'top_level.yaml': 'project_templates/top_level_template.yaml'
    }
}

def create_project_structure(base_dir: Path) -> None:
    """Creates a project structure with directories and template files"""
    # Create directories
    for dir_name in PROJECT_TEMPLATES['dirs']:
        (base_dir / dir_name).mkdir(parents=True, exist_ok=True)
    
    # Create files from templates
    for target_path, template_path in PROJECT_TEMPLATES['files'].items():
        with open(template_path, 'r') as template_file:
            (base_dir / target_path).write_text(template_file.read())