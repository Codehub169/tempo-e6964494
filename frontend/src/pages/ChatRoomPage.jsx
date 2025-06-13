import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import { socketService } from '../services/socketService';
import MessageView from '../components/chatroom/MessageView';
import MessageInput from '../components/chatroom/MessageInput';
import LoadingSpinner from '../components/common/LoadingSpinner';

const GEMINI_MODEL_NAME_DISPLAY = "gemini-1.5-flash-preview-0514"; // Hardcoded from backend config

function ChatRoomPage() {
  const { chatId } = useParams();
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();

  const [chatDetails, setChatDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const fetchChatData = useCallback(async () => {
    if (!chatId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const details = await chatService.getChatDetails(chatId);
      const otherParticipants = details.participants.filter(p => p.user.id !== user.id);
      let chatName = details.name;
      if (!chatName && details.chat_type === 'one_on_one' && otherParticipants.length > 0) {
        chatName = otherParticipants.map(p => p.user.full_name).join(', ');
      } else if (!chatName) {
        chatName = 'Chat';
      }

      let avatarUrl = `https://i.pravatar.cc/150?u=${details.id}`;
      if (details.chat_type === 'one_on_one' && otherParticipants.length > 0 && otherParticipants[0].user.avatarUrl) {
        avatarUrl = otherParticipants[0].user.avatarUrl;
      } else if (details.participants.length > 0 && details.participants[0].user.avatarUrl) {
        // Fallback for group or if own avatar is shown in some context (though usually not for chat header)
        avatarUrl = details.participants[0].user.avatarUrl;
      }

      setChatDetails({
        ...details,
        id: details.id.toString(),
        type: details.chat_type, // This is backend string like "one_on_one"
        avatarUrl: avatarUrl,
        name: chatName,
        participantsDisplay: details.participants.map(p => p.user.full_name).join(', ')
      });
      
      setMessages(details.messages.map(m => ({ 
        ...m, 
        id: m.id.toString(),
        sender: { 
            id: m.sender.id.toString(), 
            name: m.sender.full_name, 
            avatarUrl: m.sender.avatarUrl || `https://i.pravatar.cc/150?u=${m.sender.email}`,
            isBot: m.is_bot_message || m.sender.is_bot
        },
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHtml: m.is_bot_message 
      })));
      // For native WebSockets, connect when chat room is entered
      // socketService.joinChat(chatId) will call connect(chatId) internally
      socketService.joinChat(chatId);
    } catch (err) {
      console.error('Failed to fetch chat data:', err);
      setError('Could not load chat. It might not exist or you may not have access.');
      if (err.response && err.response.status === 401) {
        logout(); 
        navigate('/auth');
      } 
    } finally {
      setIsLoading(false);
    }
  }, [chatId, user, navigate, logout]);

  useEffect(() => {
    if(user && chatId) { 
        fetchChatData();
    }
    return () => {
      // socketService.leaveChat(chatId) will call disconnect() internally
      socketService.leaveChat(chatId);
    };
  }, [fetchChatData, chatId, user]); // Added user dependency for re-fetch if user changes mid-view (unlikely but safe)

  useEffect(() => {
    if (!user || !chatId) return; // Only set up listeners if user and chat ID are present

    // No need to explicitly connect here, joinChat in fetchChatData handles it.
    // And if socketService maintains single connection, it's managed there.

    const handleNewMessage = (newMessageData) => {
      // Ensure message is for the current chat. Native WS are per-chatId, so this check might be redundant
      // if emitInternalEvent is specific, but good for safety if socketService ever changes.
      if (newMessageData.chat_id && newMessageData.chat_id.toString() === chatId) {
        setMessages((prevMessages) => [...prevMessages, {
            ...newMessageData,
            id: newMessageData.id.toString(),
            sender: {
                id: newMessageData.sender.id.toString(),
                name: newMessageData.sender.full_name,
                avatarUrl: newMessageData.sender.avatarUrl || `https://i.pravatar.cc/150?u=${newMessageData.sender.email}`,
                isBot: newMessageData.is_bot_message || newMessageData.sender.is_bot
            },
            time: new Date(newMessageData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isHtml: newMessageData.is_bot_message
        }]);
      }
    };

    const handleTyping = (typingData) => {
      // Ensure typing indicator is for the current chat and not from self
      if (typingData.chatId && typingData.chatId.toString() === chatId && user && typingData.user.id.toString() !== user.id.toString()) {
        if (typingData.isTyping) {
          setTypingUsers((prev) => [...prev.filter(u => u.id !== typingData.user.id), typingData.user]);
        } else {
          setTypingUsers((prev) => prev.filter(u => u.id !== typingData.user.id));
        }
      }
    };

    const unsubNewMessage = socketService.on('new_message', handleNewMessage);
    const unsubTyping = socketService.on('typing_indicator', handleTyping);

    return () => {
      unsubNewMessage();
      unsubTyping();
    };
  }, [chatId, user]); // user dependency ensures handlers are correct if user context changes

  const handleSendMessage = async (content) => {
    if (!chatId || !user) return;
    const messageData = { content };
    try {
      await chatService.sendMessage(chatId, messageData);
      // Message will be broadcast by server via WebSocket, including to sender.
      // Typing indicator should be stopped after sending message.
      if (socketService.isConnected()) {
        socketService.sendTypingIndicator({ chatId, isTyping: false });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Could not send message.');
    }
  };
  
  const handleTypingChange = (isTyping) => {
    if (socketService.isConnected()) {
      socketService.sendTypingIndicator({ chatId, isTyping });
    }
  };

  if (isLoading) {
    return <div className="w-full h-full flex justify-center items-center bg-surface-1"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !chatDetails) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-surface-1 p-4">
        <p className="text-red-500 text-lg mb-4">{error || 'Chat not found.'}</p>
        <Link to="/dashboard" className="px-4 py-2 bg-primary text-text-primary rounded-lg hover:bg-primary-light">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  let headerAvatarSpecifics = {};
  if (chatDetails.type === 'bot') { 
    headerAvatarSpecifics.isBot = true;
  } else if (chatDetails.type === 'one_on_one') {
    // This status is a placeholder, real status would need to come from backend/socket events
    headerAvatarSpecifics.status = 'online'; 
  }

  return (
    <div className="chat-container w-full h-full bg-surface-1 flex flex-col overflow-hidden">
      <header className="chat-header flex items-center p-4 md:p-6 bg-background border-b border-border-color flex-shrink-0">
        <Link to="/dashboard" className="back-btn text-text-primary text-2xl mr-4 hover:text-primary">
          <i className="ph-arrow-left"></i>
        </Link>
        <div className="chat-header-avatar relative mr-4">
          <img 
            src={chatDetails.avatarUrl} 
            alt={`${chatDetails.name || 'Chat'} Avatar`} 
            className={`w-11 h-11 rounded-full ${headerAvatarSpecifics.isBot ? 'border-2 border-primary' : ''}`}
          />
          {headerAvatarSpecifics.isBot && (
            <div className="bot-indicator absolute bottom-[-2px] right-[-2px] w-5 h-5 bg-primary border-2 border-background rounded-full flex items-center justify-center">
              <i className="ph-robot text-xs text-text-primary"></i>
            </div>
          )}
          {/* Only show status for one_on_one and if status is set */}
          {chatDetails.type === 'one_on_one' && headerAvatarSpecifics.status && (
             <span className={`status absolute bottom-0.5 right-0.5 w-3 h-3 ${headerAvatarSpecifics.status === 'online' ? 'bg-green' : 'bg-text-secondary'} border-2 border-background rounded-full`}></span>
          )}
        </div>
        <div className="chat-header-info flex-grow">
          <h2 className="text-lg font-semibold">{chatDetails.name || 'Chat'}</h2>
          <p className={`text-sm ${chatDetails.type === 'one_on_one' && headerAvatarSpecifics.status === 'online' ? 'text-green' : 'text-text-secondary'}`}>
            {chatDetails.type === 'bot' ? `Model: ${GEMINI_MODEL_NAME_DISPLAY}` : chatDetails.participantsDisplay}
          </p>
        </div>
        <div className="chat-header-actions flex gap-5">
          {chatDetails.type !== 'bot' && <i className="ph-phone text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors"></i>}
          {chatDetails.type !== 'bot' && <i className="ph-video-camera text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors"></i>}
          <i className={`${chatDetails.type === 'bot' ? 'ph-dots-three-outline-vertical-fill' : 'ph-info'} text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors`}></i>
        </div>
      </header>

      <MessageView messages={messages} typingUsers={typingUsers} currentUserId={user?.id.toString()} />
      <MessageInput onSendMessage={handleSendMessage} onTypingChange={handleTypingChange} placeholder={`Message ${chatDetails.name || 'chat'}...`} />
    </div>
  );
}

export default ChatRoomPage;
