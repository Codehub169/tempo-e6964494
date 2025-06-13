// Using Native WebSocket API as backend uses FastAPI's native WebSockets

let currentSocket = null;
let currentChatIdInternal = null;
const eventHandlers = {};

const getWebSocketBaseUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL; // Expected to be like ws://localhost:9000 or wss://yourdomain.com
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

const on = (eventName, callback) => {
  if (!eventHandlers[eventName]) {
    eventHandlers[eventName] = [];
  }
  eventHandlers[eventName].push(callback);
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

const connect = (chatId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('SocketService: No auth token found for WebSocket connection.');
    emitInternalEvent('error', { message: 'Authentication token not found.' });
    return;
  }

  if (currentSocket && currentSocket.readyState === WebSocket.OPEN && currentChatIdInternal === chatId) {
    console.log(`SocketService: Already connected to chat ${chatId}.`);
    return;
  }

  if (currentSocket) {
    console.log(`SocketService: Closing existing socket for chat ${currentChatIdInternal} before connecting to ${chatId}.`);
    currentSocket.close();
  }

  currentChatIdInternal = chatId;
  const wsBaseUrl = getWebSocketBaseUrl();
  const socketUrl = `${wsBaseUrl}/ws/${chatId}/${token}`;
  console.log(`SocketService: Attempting to connect to ${socketUrl}`);

  currentSocket = new WebSocket(socketUrl);

  currentSocket.onopen = () => {
    console.log(`SocketService: WebSocket connected for chat ${chatId}.`);
    emitInternalEvent('connect'); 
  };

  currentSocket.onmessage = (event) => {
    try {
      const messageData = JSON.parse(event.data);
      // Assuming server sends messages like { type: 'event_name', payload: ... } or just the payload for new_message
      // Based on backend, new messages are broadcast as the full Message schema
      // Typing indicators are { type: 'typing_indicator', ... }
      if (messageData.type === 'typing_indicator') {
        emitInternalEvent('typing_indicator', messageData);
      } else {
        // Assume other messages are new chat messages
        emitInternalEvent('new_message', messageData);
      }
    } catch (error) {
      console.error('SocketService: Error parsing message data:', error, event.data);
    }
  };

  currentSocket.onerror = (error) => {
    console.error('SocketService: WebSocket error:', error);
    emitInternalEvent('connect_error', error);
  };

  currentSocket.onclose = (event) => {
    console.log(`SocketService: WebSocket disconnected for chat ${chatId}. Code: ${event.code}, Reason: ${event.reason}`);
    emitInternalEvent('disconnect', { reason: event.reason, code: event.code });
    if (currentChatIdInternal === chatId) { // Only nullify if this was the socket that closed
        currentSocket = null;
        currentChatIdInternal = null;
    }
  };
};

const disconnect = () => {
  if (currentSocket) {
    console.log(`SocketService: Disconnecting WebSocket for chat ${currentChatIdInternal}.`);
    currentSocket.close();
    currentSocket = null;
    currentChatIdInternal = null;
  }
};

const send = (data) => {
  if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
    currentSocket.send(JSON.stringify(data));
  } else {
    console.warn('SocketService: WebSocket not connected. Cannot send data.');
  }
};

// Public API Methods
const joinChat = (chatId) => {
  connect(chatId); // For native WebSockets, joining a chat means connecting to its specific endpoint
};

const leaveChat = (chatId) => {
  // Optional: check if chatId matches currentChatIdInternal before disconnecting
  // if (currentChatIdInternal === chatId) {
    disconnect();
  // }
};

// Note: Sending chat messages is done via HTTP POST, then broadcast by server via WebSocket.
// This function is for other types of messages sent from client over WS, like typing indicators.
const sendTypingIndicator = ({ chatId, isTyping }) => {
  // Ensure we're connected to the correct chat before sending
  if (currentSocket && currentSocket.readyState === WebSocket.OPEN && currentChatIdInternal === chatId) {
    send({ type: 'typing', isTyping });
  } else if (currentChatIdInternal !== chatId) {
    console.warn(`SocketService: Not connected to chat ${chatId}. Cannot send typing indicator.`);
  }
};

const isConnected = () => {
  return currentSocket ? currentSocket.readyState === WebSocket.OPEN : false;
};

export const socketService = {
  connect,    // Connects to a specific chat's WebSocket
  disconnect, // Disconnects the current WebSocket
  on,         // Subscribe to events
  off,        // Unsubscribe
  joinChat,   // Alias for connect for conceptual similarity with previous API
  leaveChat,  // Alias for disconnect
  sendTypingIndicator, // Send data (e.g., typing indicator)
  isConnected,
};
