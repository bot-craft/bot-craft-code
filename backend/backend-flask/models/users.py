from extensions import db
from config import USERS_COLLECTION_NAME
from utils.encryption import encrypt_api_key, decrypt_api_key, derive_key
from werkzeug.security import generate_password_hash, check_password_hash
from icecream import ic
import base64

def register_user(username, password, api_key=None):
    """
    Register a new user
    
    :param username: User's username
    :param password: User's password (will be hashed)
    :param api_key: API key (will be encrypted)
    :param available_chatbots: A list of the available chatbots the user has access
    :return: True if successful, False otherwise
    """
    try:
        users_collection = db[USERS_COLLECTION_NAME]
        
        # Check if user already exists
        user_doc = users_collection.find_one({"users": {"$exists": True}})
        if user_doc and username in user_doc["users"]:
            return False
        
        # Generate password hash first
        password_hash = generate_password_hash(password)
        
        # Derive key using the password hash
        key, salt = derive_key(username, password_hash)
        
        # Ensure api_key is a string before encrypting
        api_key_to_encrypt = api_key if api_key is not None else ""
        encrypted_api_key = encrypt_api_key(api_key_to_encrypt, key)

        # Store salt along with encrypted_api_key
        new_user = {
            "username": username,
            "password": password_hash,
            "available_chatbots": [],
            "api_key": encrypted_api_key,
            "api_key_salt": base64.urlsafe_b64encode(salt).decode()
        }
        
        # Update users document
        users_collection.update_one(
            {"users": {"$exists": True}},
            {"$set": {f"users.{username}": new_user}},
            upsert=True
        )
        
        return True
    except Exception as e:
        ic(f"Error registering user: {e}")
        return False

def authenticate_user(username, password):
    """
    Authenticate a user with username and password
    
    :param username: User's username
    :param password: User's password
    :return: User data with decrypted API key if successful, None otherwise
    """
    try:
        users_collection = db[USERS_COLLECTION_NAME]
        user_doc = users_collection.find_one({"users": {"$exists": True}})
        
        if not user_doc or username not in user_doc["users"]:
            return None
        
        user = user_doc["users"][username]
        if not check_password_hash(user["password"], password):
            return None
        password_hash = user["password"]
        salt = base64.urlsafe_b64decode(user["api_key_salt"].encode())
        key, _ = derive_key(username, password_hash, salt)
        user_data = {
            "username": username,
            "api_key": decrypt_api_key(user["api_key"], key)
        }
        
        return user_data
    except Exception as e:
        ic(f"Error authenticating user: {e}")
        ic(e)
        return None

def get_user_data(username):
    """
    Get user data by username
    
    :param username: Username to lookup
    :return: User data with decrypted API key, None if user not found
    """
    try:
        users_collection = db[USERS_COLLECTION_NAME]
        user_doc = users_collection.find_one({"users": {"$exists": True}})
        
        if not user_doc or username not in user_doc["users"]:
            return None
        
        user = user_doc["users"][username]
        
        # Derive key to decrypt the API key
        password_hash = user["password"]
        salt = base64.urlsafe_b64decode(user["api_key_salt"].encode())
        key, _ = derive_key(username, password_hash, salt)
        
        # Return necessary data with decrypted API key
        return {
            "username": user["username"],
            "api_key": decrypt_api_key(user["api_key"], key),
            "available_chatbots": user["available_chatbots"]
        }
    except Exception as e:
        ic(f"Error getting user data: {e}")
        return None

def update_user_settings(current_username, new_username=None, new_password=None, new_api_key=None):
    """
    Update user settings, handling re-encryption of API key if necessary.
    
    :param current_username: Current username.
    :param new_username: New username (optional).
    :param new_password: New password (optional).
    :param new_api_key: New API key (optional).
    :return: True if successful, False otherwise
    """
    try:
        users_collection = db[USERS_COLLECTION_NAME]
        user_doc = users_collection.find_one({"users": {"$exists": True}})

        if not user_doc or current_username not in user_doc["users"]:
            return False

        user_data = user_doc["users"][current_username]
        update_data = {}
        
        # Determine the password hash to be used for key derivation
        password_hash_for_encryption = user_data["password"]
        if new_password:
            new_password_hash = generate_password_hash(new_password)
            update_data["password"] = new_password_hash
            password_hash_for_encryption = new_password_hash

        # Get the salt from the user's document
        salt = base64.urlsafe_b64decode(user_data["api_key_salt"].encode())

        # Handle API key update (either new key or re-encryption due to password change)
        if new_api_key or new_password:
            # If there's a new API key, we use it. Otherwise, we decrypt the old one to re-encrypt it.
            api_key_to_encrypt = new_api_key
            if not api_key_to_encrypt:
                # Decrypt the old API key to re-encrypt it with the new password's derived key
                old_key, _ = derive_key(current_username, user_data["password"], salt)
                api_key_to_encrypt = decrypt_api_key(user_data["api_key"], old_key)

            # Derive the key for encryption (using new password hash if provided)
            encryption_key, _ = derive_key(new_username or current_username, password_hash_for_encryption, salt)
            update_data["api_key"] = encrypt_api_key(api_key_to_encrypt, encryption_key)

        # Handle username change
        if new_username and new_username != current_username:
            if new_username in user_doc["users"]:
                return False
            
            current_user_copy = user_data.copy()
            
            # If only username changes, we must re-encrypt the API key with the new username
            if not new_api_key and not new_password:
                old_key, _ = derive_key(current_username, current_user_copy["password"], salt)
                decrypted_api_key = decrypt_api_key(current_user_copy["api_key"], old_key)
                
                new_key, _ = derive_key(new_username, current_user_copy["password"], salt)
                update_data["api_key"] = encrypt_api_key(decrypted_api_key, new_key)

            # Apply all updates to the user object
            current_user_copy.update(update_data)
            current_user_copy["username"] = new_username
            
            # Perform atomic rename and update
            users_collection.update_one(
                {"users": {"$exists": True}},
                {
                    "$set": {f"users.{new_username}": current_user_copy},
                    "$unset": {f"users.{current_username}": ""}
                }
            )
        elif update_data:
            # Apply updates if username is not changing
            users_collection.update_one(
                {"users": {"$exists": True}},
                {"$set": {f"users.{current_username}.{k}": v for k, v in update_data.items()}}
            )
            
        return True
    except Exception as e:
        ic(f"Error updating user settings: {e}")
        return False

def add_chatbot_to_user(username, chatbot_name):
    """
    Adds a chatbot to a user's list of available chatbots.

    :param username: The username of the user.
    :param chatbot_name: The name of the chatbot to add.
    :return: True if successful, False otherwise.
    """
    try:
        users_collection = db[USERS_COLLECTION_NAME]
        
        # Check if user exists
        user_doc = users_collection.find_one({"users": {"$exists": True}})
        if not user_doc or username not in user_doc["users"]:
            ic(f"User '{username}' not found.")
            return False

        # Use $addToSet to avoid adding duplicate chatbot names
        result = users_collection.update_one(
            {"users": {"$exists": True}},
            {"$addToSet": {f"users.{username}.available_chatbots": chatbot_name}}
        )
        
        return result.modified_count > 0
    except Exception as e:
        ic(f"Error adding chatbot to user: {e}")
        return False

def rename_or_delete_chatbot_to_user(username, chatbot_name, new_chatbot_name=None):
    """
    Renames or deletes a chatbot from the available list for all relevant users.

    :param username: The username of the user initiating the action.
    :param chatbot_name: The current name of the chatbot.
    :param new_chatbot_name: The new name for the chatbot. If None, the chatbot is deleted.
    :return: True if successful, False otherwise.
    """
    try:
        users_collection = db[USERS_COLLECTION_NAME]
        user_doc = users_collection.find_one({"users": {"$exists": True}})

        if not user_doc or username not in user_doc["users"]:
            ic(f"User '{username}' not found.")
            return False

        # Check if the chatbot is in the requesting user's list
        if chatbot_name not in user_doc["users"][username].get("available_chatbots", []):
            ic(f"Chatbot '{chatbot_name}' not found in user '{username}'s list.")
            return False

        # Find all users who have the chatbot
        users_with_chatbot = [
            u for u, data in user_doc["users"].items() 
            if chatbot_name in data.get("available_chatbots", [])
        ]

        if not users_with_chatbot:
            # This case should ideally not be hit if the first check passes, but as a safeguard:
            return True 

        # If new_chatbot_name is None, delete the chatbot from each user's list
        if new_chatbot_name is None:
            for user_to_update in users_with_chatbot:
                users_collection.update_one(
                    {"users": {"$exists": True}},
                    {"$pull": {f"users.{user_to_update}.available_chatbots": chatbot_name}}
                )
        # Otherwise, rename the chatbot in each user's list
        else:
            for user_to_update in users_with_chatbot:
                # To rename, we pull the old name and push the new one.
                # This is done in two steps to ensure atomicity at the user level.
                # A more complex single update could use arrayFilters but this is clearer.
                users_collection.update_one(
                    {"users": {"$exists": True}},
                    {"$pull": {f"users.{user_to_update}.available_chatbots": chatbot_name}}
                )
                users_collection.update_one(
                    {"users": {"$exists": True}},
                    {"$addToSet": {f"users.{user_to_update}.available_chatbots": new_chatbot_name}}
                )
        
        return True
    except Exception as e:
        ic(f"Error renaming or deleting chatbot: {e}")
        return False