from flask import Blueprint, jsonify, request
from extensions import db
from config import CB_COLLECTION_NAME
from icecream import ic
from models.chatbots import get_conversations

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route('/api/conversations/<chatbot_slug>', methods=['GET'])
def get_conversation_list(chatbot_slug):
    """Get a list of all conversations for a chatbot"""
    try:
        conversations = get_conversations(chatbot_slug)
        
        if conversations:
            ic(list(conversations.keys()))
            return jsonify({'conversations': conversations})
        
        return jsonify({'conversations': []})
    except Exception as e:
        ic(e)
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/api/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation for a chatbot"""
    try:
        data = request.json
        chatbot_slug = data['chatbotSlug']
        conversation_name = data['conversationName']

        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Update the existing document
        result = chatbot_collection.update_one(
            {},  # Update the single existing document
            {'$set': {
                f'chatbots.{chatbot_slug}.conversations.{conversation_name}': {
                    'id': None,
                    'interaction': [],
                    'is_dead': False
                }
            }}
        )

        return jsonify({'success': True, 'conversationName': conversation_name})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/api/conversations/<chatbot_slug>/<conversation_name>/messages', methods=['GET'])
def get_conversation_messages(chatbot_slug, conversation_name):
    """Get all messages for a specific conversation"""
    try:
        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Find the specific chatbot document
        chatbot_doc = chatbot_collection.find_one({"chatbots":{"$exists":True}})
        chatbot_doc = chatbot_doc.get("chatbots", {})
        
        if chatbot_doc and chatbot_slug in chatbot_doc:
            conversations = chatbot_doc[chatbot_slug]['conversations']
            if conversation_name in conversations:
                messages = conversations[conversation_name]['interaction']
                return jsonify({'messages': messages})
        
        return jsonify({'messages': []})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@conversations_bp.route('/api/conversations/<chatbot_slug>/<conversation_name>/messages', methods=['POST'])
def add_message_to_conversation(chatbot_slug, conversation_name):
    """Add a new message to a conversation"""
    try:
        data = request.json
        message = data.get('message')
        conversation_id = data.get('conversationId')
        ic(conversation_id)

        chatbot_collection = db[CB_COLLECTION_NAME]

        ic(data)
        
        # Update the existing document
        result = chatbot_collection.update_one(
            {},  # Update the single existing document
            {'$push': {
                f'chatbots.{chatbot_slug}.conversations.{conversation_name}.interaction': message
            }}
        )

        current_id = chatbot_collection.find_one({})['chatbots'][chatbot_slug]['conversations'][conversation_name]['id']
        ic(current_id)

        if not current_id:
            result = chatbot_collection.update_one(
                {},  # Update the single existing document
                {'$set': {
                    f'chatbots.{chatbot_slug}.conversations.{conversation_name}.id': conversation_id
                }}
            )

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@conversations_bp.route('/api/conversations/<chatbot_slug>/mark-dead', methods=['PUT'])
def mark_conversations_dead(chatbot_slug):
    """Mark all conversations for a chatbot as dead"""
    try:
        chatbot_collection = db[CB_COLLECTION_NAME]
        
        # Find the existing document
        existing_doc = chatbot_collection.find_one({})
        
        if not existing_doc or 'chatbots' not in existing_doc:
            return jsonify({
                'success': False, 
                'message': 'No chatbots found in the document'
            }), 404
        
        # Create an update operation to set is_dead to True for all conversations
        update_ops = {
            f'chatbots.{chatbot_slug}.conversations.{conv_name}.is_dead': True 
            for conv_name in existing_doc['chatbots'].get(chatbot_slug, {}).get('conversations', {}).keys()
        }
        
        # Perform the update
        result = chatbot_collection.update_one(
            {},  # Update the single document
            {'$set': update_ops}
        )
        
        return jsonify({
            'success': True, 
            'message': f'All conversations for {chatbot_slug} marked as dead',
            'modified_count': result.modified_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500