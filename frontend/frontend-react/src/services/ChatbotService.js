import axios from './axios';

class ChatbotService {

  // Chatbot ctrl

  static async checkChatbotStatus(chatbotSlug) {
    try {
      const response = await axios.post('/chatbot_manage/ctrl', {
        cmd: 'info',
        chatbot: chatbotSlug,
      }, {
        baseURL: `http://${process.env.REACT_APP_IP_ADDRESS}:5000`,
        withCredentials: false,
      });
      
      return response.data.data.chatbots_info[chatbotSlug].status;
    } catch (error) {
      console.error('Error checking chatbot status:', error);
      throw error;
    }
  }

  static async powerChatbot(chatbotSlug, powerState, api_key) {
    try {
      // console.log('API Key in powerChatbot:', api_key);
      
      const response = await axios.post('/chatbot_manage/ctrl', {
        cmd: 'power',
        chatbot: chatbotSlug,
        data: powerState,
        api_key: api_key
      }, {
        baseURL: `http://${process.env.REACT_APP_IP_ADDRESS}:5000`,
        withCredentials: false,
      });
      
      return response;
    } catch (error) {
      console.error('Error checking chatbot status:', error);
      throw error;
    }
  }

  static async sendMsgToChatbot(chatbotSlug, message, conversationId) {
    try {
        
      const msgPayload = {
        // ******ToDo******: 
        // Poner aquí la id de la conversación, resultado del ToDo anterior (puede ser null, no pasa nada, el valor que tenga)
        "conversation_id": conversationId,
        "message": message,
      }
      
      // Msg to chatbot
      const response = await axios.post('/chatbot_manage/ctrl', {
        cmd: 'msg',
        chatbot: chatbotSlug,
        // data: message
        data: JSON.stringify(msgPayload)
      }, {
        baseURL: `http://${process.env.REACT_APP_IP_ADDRESS}:5000`,
        withCredentials: false,
      });

      return response.data;
  
  
      // FABADA Si es una
  
      // // ******ToDo******
      // Añadimos en MongoDB a <chatbots.<chatbotSlug>.conversations.<currentConversationName>.interaction>
      // este contenido { text: message, isBot: false, timestamp: userTimestamp }
      
      
      // // ******ToDo******
      // Si la id que obtuvimos al principio fue null...
      // Añadimos en MongoDB a <chatbots.<chatbotSlug>.conversations.<currentConversationName>.id = botConversationId>
  
      
      // // ******ToDo******
      // Añadimos en MongoDB a <chatbots.<chatbotSlug>.conversations.<currentConversationName>.<interaction>>
      // este contenido { text: botResponse, isBot: true, timestamp: botTimestamp }
      
  
      // console.log({ text: botResponse, isBot: true, timestamp: botTimestamp});
  
    } catch (error) {

      console.error('Error sending message:', error);
      throw error;
    }
  
  }

  // We send it to the backend instead of the chatbot REST API
  static async checkAPIKey(api_key) {
    try {
      // console.log('API Key in checkAPIKey:', api_key);

      const response = await axios.post('/chatbot_manage/ctrl', {
        cmd: 'api_key_check',
        api_key: api_key
      }, {
        baseURL: `http://${process.env.REACT_APP_IP_ADDRESS}:5000`,
        withCredentials: false,
      });

      return response.data.is_valid;

    } catch (error) {
      console.error('Error checking chatbot status:', error);
      throw error;
    }


  }
}

export default ChatbotService;