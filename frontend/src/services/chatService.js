import apiClient from './apiClient';

const chatService = {
  getChats: async () => {
    try {
      const response = await apiClient.get('/chats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching chats:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  getChatDetails: async (chatId) => {
    try {
      const response = await apiClient.get(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  createChat: async (chatData) => {
    // chatData: { name (optional), type ('ONE_ON_ONE', 'GROUP', 'BOT'), participant_ids (list of user IDs as strings or numbers) }
    try {
      const response = await apiClient.post('/chats/', chatData);
      return response.data;
    } catch (error) {
      console.error('Error creating chat:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  sendMessage: async (chatId, messageData) => {
    // messageData: { content: string }
    try {
      const response = await apiClient.post(`/chats/${chatId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error(`Error sending message to chat ${chatId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  getMessages: async (chatId, skip = 0, limit = 50) => {
    try {
      const response = await apiClient.get(`/chats/${chatId}/messages?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  getAvailableContacts: async () => {
    try {
      // This endpoint is now /api/users/contacts as defined in users.py router
      const response = await apiClient.get('/users/contacts'); 
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

export default chatService;
