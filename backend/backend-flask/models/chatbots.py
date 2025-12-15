from extensions import db
from config import CB_COLLECTION_NAME
from icecream import ic

def add_chatbot_to_collection(chatbot_name):
    """
    Add a new chatbot to the chatbots collection with no conversations.
    
    :param chatbot_name: Slug of the new chatbot
    :return: True if successful, False otherwise
    """
    try:
        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Find the existing document
        existing_doc = chatbot_collection.find_one({})
        
        if not existing_doc:
            # If no document exists, create a new one
            existing_doc = {"chatbots": {}}
        
        # Prepare the new chatbot structure
        new_chatbot = {
            "conversations": {}
        }       
                
        # Add the new chatbot to the existing document
        existing_doc["chatbots"][chatbot_name] = new_chatbot
        
        # Replace the entire document
        chatbot_collection.replace_one({}, existing_doc, upsert=True)
        
        return True
    except Exception as e:
        ic(f"Error adding chatbot: {e}")
        return False

def rename_chatbot_db(old_slug, new_slug):
    """
    Rename a chatbot in the collection.
    
    :param old_slug: Current slug of the chatbot
    :param new_slug: New slug for the chatbot
    :return: Renamed chatbot details or None if failed
    """
    try:
        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Find the existing document
        existing_doc = chatbot_collection.find_one({})
        
        if not existing_doc or 'chatbots' not in existing_doc:
            ic("No chatbots document found")
            return None
        
        # Check if old chatbot exists
        if old_slug not in existing_doc['chatbots']:
            ic(f"Chatbot {old_slug} not found")
            return None
        
        # Get the chatbot content
        chatbot_content = existing_doc['chatbots'][old_slug]
        
        # Remove old chatbot
        del existing_doc['chatbots'][old_slug]
        
        # Add chatbot with new slug
        existing_doc['chatbots'][new_slug] = chatbot_content
        
        # Replace the entire document
        chatbot_collection.replace_one({}, existing_doc)
        
        return existing_doc['chatbots'][new_slug]
    except Exception as e:
        ic(f"Error renaming chatbot: {e}")
        return None

def delete_chatbot_db(chatbot_slug):
    """
    Delete a chatbot from the collection.
    
    :param chatbot_slug: Slug of the chatbot to delete
    :return: True if successful, False otherwise
    """
    try:
        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Find the existing document
        existing_doc = chatbot_collection.find_one({})
        
        if not existing_doc or 'chatbots' not in existing_doc:
            ic("No chatbots document found")
            return False
        
        # Check if chatbot exists
        if chatbot_slug not in existing_doc['chatbots']:
            ic(f"Chatbot {chatbot_slug} not found")
            return False
        
        # Remove the chatbot
        del existing_doc['chatbots'][chatbot_slug]
        
        # Replace the entire document
        chatbot_collection.replace_one({}, existing_doc)
        
        return True
    except Exception as e:
        ic(f"Error deleting chatbot: {e}")
        return False

def get_conversations(chatbot_slug):
    """
    Get all conversations for a chatbot
    """
    try:
        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Find the chatbot document
        chatbot_doc = chatbot_collection.find_one({"chatbots":{"$exists":True}})
        if not chatbot_doc:
            return {}
            
        chatbot_doc = chatbot_doc.get("chatbots", {})
        
        if chatbot_doc and chatbot_slug in chatbot_doc:
            return chatbot_doc[chatbot_slug]['conversations']
        
        return {}
    except Exception as e:
        ic(f"Error getting conversations: {e}")
        return {}