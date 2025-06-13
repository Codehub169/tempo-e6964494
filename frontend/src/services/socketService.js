import { io } from 'socket.io-client';

// Determine WebSocket URL from environment variable or use current origin
const WEBSOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket = null;

// Simple local event emitter to allow multiple parts of the app to subscribe to socket events
const eventHandlers = {};

const on = (eventName, callback) => {
  if (!eventHandlers[eventName]) {
    eventHandlers[eventName] = [];
  }
  eventHandlers[eventName].push(callback);
  // Return an unsubscribe function
  return () => {
    off(eventName, callback);
  };
};

const off = (eventName, callback) => {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName] = eventHandlers[eventName].filter(cb => cb !== callback);
  }
};

const emitInternalEvent = (eventName, data) => {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in socket event handler for ${eventName}:`, error);
      }
    });
  }
};

/**
 * Connects to the WebSocket server.
 * @param {string} token - The authentication token.
 */
const connect = (token) => {
  if (socket && socket.connected) {
    console.warn('Socket is already connected.');
    return;
  }

  // Disconnect and clean up listeners from any previous socket instance
  if (socket) {
    socket.off(); // Remove all listeners from the old socket instance
    socket.disconnect();
  }
  
  console.log(`Attempting to connect to WebSocket server at ${WEBSOCKET_URL}`);
  socket = io(WEBSOCKET_URL, {
    auth: { token },
    transports: ['websocket'], // Prefer WebSocket transport
    reconnectionAttempts: 5,   // Number of reconnection attempts
    timeout: 10000,            // Connection timeout in ms
    // path: '/socket.io', // Default path, adjust if backend Socket.IO server is on a different path
  });

  // Standard Socket.IO events
  socket.on('connect', () => {
    console.log('Socket connected successfully. ID:', socket.id);
    emitInternalEvent('connect');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected. Reason:', reason);
    emitInternalEvent('disconnect', reason);
    // If the server disconnects (e.g., auth error), socket.io might try to reconnect based on options.
    // Handle permanent auth failures or advise user if needed.
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    emitInternalEvent('connect_error', error);
  });

  // Application-specific events from the server
  // These event names should match what the backend emits
  socket.on('new_message', (messageData) => {
    // Expected: { chatId: string, message: MessageObject }
    emitInternalEvent('new_message', messageData);
  });

  socket.on('typing_indicator', (typingData) => {
    // Expected: { chatId: string, user: { id: string, name: string }, isTyping: boolean }
    emitInternalEvent('typing_indicator', typingData);
  });

  socket.on('user_status_update', (statusData) => {
    // Expected: { userId: string, isOnline: boolean, lastSeen?: string }
    emitInternalEvent('user_status_update', statusData);
  });

  socket.on('chat_updated', (chatData) => {
    // Expected: { chatId: string, updatedData: { name?: string, members?: UserObject[] } }
    emitInternalEvent('chat_updated', chatData);
  });

  socket.on('server_error', (errorData) => {
    // Expected: { message: string, details?: any }
    console.error('Server error via WebSocket:', errorData);
    emitInternalEvent('server_error', errorData);
  });
};

/**
 * Disconnects from the WebSocket server.
 */
const disconnect = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    // The 'disconnect' event will be fired, no need to set socket = null here
    // as socket.io handles the object state and reconnection attempts.
  }
};

/**
 * Emits an event to the WebSocket server.
 * @param {string} eventName - The name of the event.
 * @param {object} data - The data to send with the event.
 */
const emitToServer = (eventName, data) => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.warn(`Socket not connected. Cannot emit event '${eventName}' to server.`);
    // Optionally, queue messages or handle error
  }
};

// --- Public API Methods ---

/**
 * Joins a specific chat room.
 * @param {string} chatId - The ID of the chat to join.
 */
const joinChat = (chatId) => {
  emitToServer('join_chat', { chatId });
};

/**
 * Leaves a specific chat room.
 * @param {string} chatId - The ID of the chat to leave.
 */
const leaveChat = (chatId) => {
  emitToServer('leave_chat', { chatId });
};

/**
 * Sends a chat message.
 * @param {object} params
 * @param {string} params.chatId - The ID of the chat.
 * @param {string} params.content - The message content.
 */
const sendMessage = ({ chatId, content }) => {
  emitToServer('send_message', { chatId, content });
};

/**
 * Sends a typing indicator status.
 * @param {object} params
 * @param {string} params.chatId - The ID of the chat.
 * @param {boolean} params.isTyping - True if the user is typing, false otherwise.
 */
const sendTypingIndicator = ({ chatId, isTyping }) => {
  emitToServer('typing', { chatId, isTyping });
};

/**
 * Checks if the WebSocket is currently connected.
 * @returns {boolean} True if connected, false otherwise.
 */
const isConnected = () => {
  return socket ? socket.connected : false;
};

export const socketService = {
  connect,
  disconnect,
  on,       // Method to subscribe to events received from the server
  off,      // Method to unsubscribe from events
  joinChat,
  leaveChat,
  sendMessage,
  sendTypingIndicator,
  isConnected,
};
