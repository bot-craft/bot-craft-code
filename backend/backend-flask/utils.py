import os
import yaml
from pathlib import Path

PROJECTS_DIR = Path("user_projects")

CB_URL = "http://twp-chatbot-llm:5000/chatbot_manage/ctrl"

from requests import Response
import requests

ERROR, SUCCESS = 0, 1
###############################
#### CHATBOT CONVERSATIONS ####
###############################


# Auxiliar functions
def unpack_request(request) -> dict | None:
    
    if not (body:=request.json.get("body")):
        return None
    import json

    return json.loads(body)
    

def get_project_list():
    """Obtiene la lista de proyectos del directorio user_projects"""
    projects = []
    for project_dir in PROJECTS_DIR.iterdir():
        if project_dir.is_dir() and (project_dir / "top_level.yaml").exists():
            projects.append({
                "name": project_dir.name,
                "slug": project_dir.name,
                "active": True  # Por defecto los proyectos están activos
            })
    return projects

def is_chatbot_on(chatbot_slug) -> bool:
    # endpoint = f"{CB_URL}/check_power"
    endpoint = f'http://twp-chatbot-llm:5000/chatbot_manage/ctrl'
    body = {
        "cmd": "info",
        "chatbot": chatbot_slug,
    }
    
    post_response: Response = requests.post(url=endpoint, json=body)

    is_on = False

    try:
        post_response_json = post_response.json()
        is_on = post_response_json.get("data", {}).get("chatbots_info", {}).get(chatbot_slug, {}).get("status", False)
        is_on = True if is_on == "on" else False
        
    except Exception as e:
        print(f"Exception in funcution is_chatbot_on: {e}")
        print(f"post_response_json: {post_response_json}")
    
    finally:
        return is_on

def rename_chatbot(chatbot_slug, new_name) -> dict:
    endpoint = 'http://0.0.0.0:5000/chatbot_manage/ctrl'
    body = {
        "cmd": "rename",
        "chatbot": chatbot_slug,
        "data": new_name
    }
    
    post_response: Response = requests.post(url=endpoint, json=body)


    try:
        post_response_json = post_response.json()
        
    except Exception as e:
        print(f"Exception in funcution rename_chatbot: {e}")
        print(f"post_response: {post_response_json}")

    return post_response_json