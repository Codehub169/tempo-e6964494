import apiClient from './apiClient';

const chatService = {
  // Fetch all chats for the current user
  getChats: async () => {
    try {
      const response = await apiClient.get('/chats/');
      return response.data; // Expected: List of Chat objects
    } catch (error) {
      console.error('Error fetching chats:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Fetch a specific chat by its ID, including messages
  getChatDetails: async (chatId) => {
    try {
      const response = await apiClient.get(`/chats/${chatId}`);
      return response.data; // Expected: Chat object with messages and participants
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Create a new chat
  // For 1-on-1: participant_ids = [other_user_id]
  // For Group: participant_ids = [user_id1, user_id2, ...]
  // For Bot chat: participant_ids = [], type = 'BOT' (or handle bot logic server-side based on a flag)
  createChat: async (chatData) => {
    // chatData: { name (optional for 1-1, required for group), type ('ONE_ON_ONE', 'GROUP', 'BOT'), participant_ids (list of user IDs) }
    try {
      const response = await apiClient.post('/chats/', chatData);
      return response.data; // Expected: Newly created Chat object
    } catch (error) {
      console.error('Error creating chat:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Send a message to a chat
  sendMessage: async (chatId, messageData) => {
    // messageData: { content: string }
    // sender_id will be derived from the auth token on the backend
    try {
      const response = await apiClient.post(`/chats/${chatId}/messages`, messageData);
      return response.data; // Expected: Newly created Message object
    } catch (error) {
      console.error(`Error sending message to chat ${chatId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Fetch messages for a specific chat (paginated - not implemented yet, basic fetch all)
  getMessages: async (chatId) => {
    try {
      // This endpoint might be part of getChatDetails or separate for pagination
      // Assuming /chats/{chat_id}/messages for now if not included in getChatDetails
      const response = await apiClient.get(`/chats/${chatId}/messages`);
      return response.data; // Expected: List of Message objects
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  },
  
  // Get available users/contacts to start a new chat with (excluding current user)
  getAvailableContacts: async () => {
    try {
      // Assuming an endpoint like /users/contacts or similar that lists users available for chat
      // This might be /users/ excluding the current user.
      const response = await apiClient.get('/users/contacts'); // Placeholder endpoint
      return response.data; // Expected: List of User objects (id, full_name, email, etc.)
    } catch (error) {
      console.error('Error fetching contacts:', error.response ? error.response.data : error.message);
      throw error;
    }
  },
};

export default chatService;
