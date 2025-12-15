from extensions import db, client
from config import DB_NAME, CB_COLLECTION_NAME, USERS_COLLECTION_NAME
from utils.projects import get_project_list
from icecream import ic

def initialize_database():
    """Initialize and verify MongoDB collections and documents on startup"""
    # Verify database exists, if not it will be created automatically
    if DB_NAME not in client.list_database_names():
        ic("DB NO EXISTE!!!")
        print(f"Database {DB_NAME} not found. Creating...")
    
    # Verify chatbots collection exists
    if CB_COLLECTION_NAME not in db.list_collection_names():
        ic("Colección chatbots NO EXISTE!!!")
        print(f"Colección {CB_COLLECTION_NAME} no encontrada. Creando...")
        db.create_collection(CB_COLLECTION_NAME)
    
    # Verify users collection exists
    if USERS_COLLECTION_NAME not in db.list_collection_names():
        print(f"Collection {USERS_COLLECTION_NAME} not found. Creating...")
        db.create_collection(USERS_COLLECTION_NAME)
        # Create initial users document
        users_collection = db[USERS_COLLECTION_NAME]
        users_collection.insert_one({"users": {}})
    
    # Get chatbots collection
    chatbots_collection = db[CB_COLLECTION_NAME]
    
    # Get current projects list
    projects = get_project_list()
    
    # Find existing chatbots document
    existing_doc = chatbots_collection.find_one({"chatbots":{"$exists":True}})

    default_conversation = {
        "default": {
            "id": None,
            "interaction": [],
            "is_dead": False
        }
    }
    
    # If no document exists, create one with current projects
    if not existing_doc:
        ic("NOOOOO EXISTEEEE!!!")
        base_doc = {"chatbots": {}}
        for project in projects:
            slug = project['slug']
            base_doc["chatbots"][slug] = {
                "conversations": default_conversation
            }
        
        chatbots_collection.insert_one(base_doc)
        print("Base document created with current projects.")
        return
    
    # Create a new document with the exact structure
    updated_doc = {"chatbots": {}}
    
    # Preserve conversations from existing projects
    for project in projects:
        ic(project['slug'])
        
        slug = project['slug']

        ic(slug in existing_doc["chatbots"])
        
        # If project already existed, keep its conversations
        if slug in existing_doc["chatbots"]:
            ic("VICTORIAAAAAA!!!")
            updated_doc["chatbots"][slug] = existing_doc["chatbots"][slug]
        else:
            ic(f"creando un nuevo proyecto {slug}")
            # If it's a new project, create empty structure
            updated_doc["chatbots"][slug] = {"conversations": default_conversation}
    
    # Replace the complete document
    chatbots_collection.replace_one({}, updated_doc)
    
    print("Database updated with current projects.")
    print(f"Projects in database: {list(updated_doc['chatbots'].keys())}")