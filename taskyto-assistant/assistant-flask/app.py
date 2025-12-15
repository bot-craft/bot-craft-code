from flask import Flask, request, jsonify
from flask_cors import CORS  # Importar Flask-CORS
import os
import logging

from assistant_logic import simple_chat

from icecream import install
install()  # Initialize icecream for debugging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create Flask instance
app = Flask(__name__)

# Habilitar CORS para todas las rutas
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint to verify the API is working"""
    return jsonify({
        "status": "ok",
        "message": "Taskyto Assistant API is running",
    })

@app.route('/api/chat', methods=['POST'])
def chat_simple():
    data = request.json

    promt = data.get("prompt")
    context = data.get("context", None)
    api_key = data.get("api_key", None)

    response = simple_chat(prompt=promt, context=context, api_key=api_key)

    print("-------------------")  # Debugging output
    # print(response)  # Debugging output
    ic(response.get("processing_time_seconds"))  # Debugging output

    return jsonify(response)

@app.route('/api/chat/clear-history', methods=['DELETE'])
def clear_chat_history():
    try:
        # Path to the chat_history.json file
        history_file_path = 'chat_history.json'
        
        # Check if the file exists and delete it
        if os.path.exists(history_file_path):
            os.remove(history_file_path)
            logger.info('Conversation history file deleted successfully.')
            return jsonify({
                "status": "success",
                "message": "Conversation history cleared."
            })
        else:
            logger.info('Conversation history file not found, nothing to clear.')
            return jsonify({
                "status": "success",
                "message": "Conversation history was already empty."
            })
    except Exception as e:
        logger.error(f'Error clearing conversation history: {e}')
        return jsonify({
            "status": "error",
            "message": "Failed to clear conversation history."
        }), 500


if __name__ == '__main__':
    debug_mode = os.environ.get('DEBUG_MODE', 'False').lower() in ('true', '1', 't')
    app.run(debug=debug_mode, host='0.0.0.0', port=int(os.environ.get('PORT', 4000)))