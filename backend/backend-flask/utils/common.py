from flask import request
import yaml

# Custom YAML representer to force literal block style for multiline strings
def str_presenter(dumper, data):
    if len(data.splitlines()) > 1:  # check for multiline string
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

# Register the custom representer
yaml.add_representer(str, str_presenter)

def unpack_request(request) -> dict | None:
    """Helper function to extract JSON data from a request"""
    try:
        if not (body:=request.json.get("body")):
            return None
        import json

        return json.loads(body)
    
    except Exception as e:
        return None