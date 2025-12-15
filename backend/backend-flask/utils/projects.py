from config import PROJECTS_DIR
from pathlib import Path
from icecream import ic
from models.users import get_user_data

CB_URL = "http://twp-chatbot-llm:5000/chatbot_manage/ctrl"

from requests import Response
import requests
# from routes.auth import get_user

def get_project_list(current_user: str=None) -> list:
    """Returns a list of all projects with their metadata"""
    projects = []

    # Pending filtrar si currenr_user no es None

    if current_user:
        user_available_chatbots = get_user_data(current_user).get('available_chatbots')

        # print(f"user_available_chatbots: {user_available_chatbots}")

        # for project_dir in PROJECTS_DIR.iterdir():
        #     if project_dir.is_dir() and (project_dir / "top_level.yaml").exists():
        #         print(project_dir.name)
        
        for project_dir in PROJECTS_DIR.iterdir():
            if project_dir.is_dir() and (project_dir / "top_level.yaml").exists() and project_dir.name in user_available_chatbots:
                projects.append({
                    'name': project_dir.name,
                    'slug': project_dir.name,
                    # 'active': is_chatbot_on(project_dir.name)
                    'active': True
                })
    else:
        for project_dir in PROJECTS_DIR.iterdir():
            if project_dir.is_dir() and (project_dir / "top_level.yaml").exists():
                projects.append({
                    'name': project_dir.name,
                    'slug': project_dir.name,
                    # 'active': is_chatbot_on(project_dir.name)
                    'active': True
                })
            
    return projects

def is_chatbot_on(chatbot_slug) -> bool:
    """Check if a chatbot is currently active"""
    endpoint = CB_URL
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
    

def rename_chatbot(chatbot_slug, new_name):
    """Rename a chatbot in the chatbot API"""
    endpoint = CB_URL
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