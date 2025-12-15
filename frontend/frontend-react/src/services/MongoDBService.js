import axios from './axios';

class MongoDBService {
  static async getConversations(chatbotSlug) {
    try {
      const response = await axios.get(`/api/conversations/${chatbotSlug}`);
      return response.data.conversations || {};
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // static async getCurrentConversationId(chatbotSlug, conversationName) {
  //   try {
  //     const response = await axios.get('/api/conversations', {
  //       chatbotSlug,
  //       conversationName
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error creating conversation:', error);
  //     throw error;
  //   }
  // }

  static async createChatbotConversation(chatbotSlug, conversationName) {
    try {
      const response = await axios.post('/api/conversations', {
        chatbotSlug,
        conversationName
      });
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  static async getConversationMessages(chatbotSlug, conversationName) {
    try {
      const response = await axios.get(`/api/conversations/${chatbotSlug}/${conversationName}/messages`);
      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  static async addMessageToConversation(chatbotSlug, conversationName, message, conversationId) {
    try {
      const response = await axios.post(`/api/conversations/${chatbotSlug}/${conversationName}/messages`, {
        message,
        conversationId
      });
      return response.data;
      // console.log(response.data);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  static async markConversationsDead(chatbotSlug) {
    try {
      const response = await axios.put(`/api/conversations/${chatbotSlug}/mark-dead`);
      return response.data;
    } catch (error) {
      console.error('Error marking conversations as dead:', error);
      throw error;
    }
  }

  // Auth methods
  static async register(username, password, apiKey) {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        password,
        apiKey
      });
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  static async login(username, password) {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      const response = await axios.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const response = await axios.get('/api/auth/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async updateUserSettings(username, password, apiKey) {
    try {
      const response = await axios.put('/api/auth/settings', {
        username,
        password,
        apiKey
      });
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}

export default MongoDBService;