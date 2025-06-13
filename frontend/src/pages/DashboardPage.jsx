import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/dashboard/ChatList';
import NewChatModal from '../components/dashboard/NewChatModal';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import { socketService } from '../services/socketService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ChatType } from '../utils/enums'; // Import frontend ChatType enum

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [error, setError] = useState(null);

  const fetchChats = useCallback(async () => {
    setIsLoadingChats(true);
    setError(null);
    try {
      const fetchedChats = await chatService.getChats();
      const formattedChats = fetchedChats.map(chat => ({
        ...chat,
        id: chat.id.toString(),
        type: chat.chat_type, // This is the backend string e.g. "one_on_one"
        name: chat.name || (chat.participants && chat.participants.length > 0 ? chat.participants.map(p => p.user.full_name).filter(name => user && name !== user.full_name).join(', ') : 'Chat'),
        lastMessage: chat.messages && chat.messages.length > 0 
                       ? { text: chat.messages[0].content, senderName: chat.messages[0].sender?.full_name || (chat.messages[0].is_bot_message ? 'Bot' : 'Unknown') } 
                       : { text: 'No messages yet.'},
        timestamp: chat.updated_at ? new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        avatarUrl: chat.chat_type === ChatType.ONE_ON_ONE 
                    ? chat.participants?.find(p => user && p.user.id !== user.id)?.user?.avatarUrl || `https://i.pravatar.cc/150?u=${chat.id}`
                    : chat.participants?.[0]?.user?.avatarUrl || `https://i.pravatar.cc/150?u=${chat.id}`,
        unreadCount: chat.unreadCount || 0, // Assuming backend might provide this, else default
      }));      
      setChats(formattedChats);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      setError('Could not load chats. Please try again.');
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/auth');
      }
    } finally {
      setIsLoadingChats(false);
    }
  }, [logout, navigate, user]);

  useEffect(() => {
    if (user) { // Only fetch chats if user is loaded
        fetchChats();
    }
  }, [fetchChats, user]);

  useEffect(() => {
    if (!user || !socketService) return; // Ensure user and socketService are available

    const token = localStorage.getItem('authToken');
    if (token && !socketService.isConnected()) {
        socketService.connect(token); 
    }

    const handleNewMessage = (messageData) => {
        setChats(prevChats => {
            const chatIndex = prevChats.findIndex(c => c.id === messageData.chat_id.toString());
            if (chatIndex === -1) return prevChats; 

            const updatedChat = {
                ...prevChats[chatIndex],
                lastMessage: { text: messageData.content, senderName: messageData.sender?.full_name || (messageData.is_bot_message ? 'Bot' : 'Unknown') },
                timestamp: new Date(messageData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            const newChats = [updatedChat, ...prevChats.slice(0, chatIndex), ...prevChats.slice(chatIndex + 1)];
            return newChats;
        });
    };

    const handleChatUpdated = (updatedChatData) => {
        fetchChats(); 
    };

    const unsubNewMessage = socketService.on('new_message', handleNewMessage);
    const unsubChatUpdated = socketService.on('chat_updated', handleChatUpdated);

    return () => {
      unsubNewMessage();
      unsubChatUpdated();
    };
  }, [fetchChats, selectedChatId, user]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setError(null); // Clear modal-related errors on close
  }

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    navigate(`/chat/${chatId}`);
  };

  const handleStartChat = async (selectedContactIds, chatName = null, chatTypeFromModal = null) => {
    if (!user) return;
    setError(null);

    let typeToUseInPayload; // This will be the string value from the enum e.g. "one_on_one"

    if (chatTypeFromModal) {
      typeToUseInPayload = chatTypeFromModal; // chatTypeFromModal is already the string value from ChatType enum
    } else {
      // Fallback logic, should ideally not be hit if NewChatModal works correctly
      if (selectedContactIds.length > 1) {
        typeToUseInPayload = ChatType.GROUP;
      } else if (selectedContactIds.length === 1) {
        const contact = dummyContacts.find(c => c.id.toString() === selectedContactIds[0].toString());
        if (contact && contact.is_bot) {
          typeToUseInPayload = ChatType.BOT;
        } else {
          typeToUseInPayload = ChatType.ONE_ON_ONE;
        }
      } else {
        setError('Please select at least one contact.');
        return;
      }
    }

    const chatData = {
      name: chatName,
      type: typeToUseInPayload, // Use the determined string value ('one_on_one', 'group', 'bot')
      participant_ids: selectedContactIds.map(id => parseInt(id, 10)), // Backend expects integers
    };

    try {
      const newChatFromBackend = await chatService.createChat(chatData);
      // Format the new chat to match the structure used in ChatList
      const formattedNewChat = {
        ...newChatFromBackend,
        id: newChatFromBackend.id.toString(),
        type: newChatFromBackend.chat_type, // Use backend's chat_type string
        name: newChatFromBackend.name || (newChatFromBackend.participants && newChatFromBackend.participants.length > 0 ? newChatFromBackend.participants.map(p => p.user.full_name).filter(name => user && name !== user.full_name).join(', ') : 'Chat'),
        lastMessage: { text: 'No messages yet.' }, // New chat starts with no messages
        timestamp: new Date(newChatFromBackend.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatarUrl: newChatFromBackend.chat_type === ChatType.ONE_ON_ONE 
                    ? newChatFromBackend.participants?.find(p => user && p.user.id !== user.id)?.user?.avatarUrl || `https://i.pravatar.cc/150?u=${newChatFromBackend.id}`
                    : newChatFromBackend.participants?.[0]?.user?.avatarUrl || `https://i.pravatar.cc/150?u=${newChatFromBackend.id}`,
        unreadCount: 0,
      };
      setChats(prevChats => [formattedNewChat, ...prevChats]);
      closeModal();
      navigate(`/chat/${newChatFromBackend.id}`);
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError(err.response?.data?.detail || 'Could not start chat.');
    }
  };
  
  const [dummyContacts, setDummyContacts] = useState([]);
  useEffect(() => {
    const fetchContacts = async () => {
        if (!user) return; // Don't fetch if user isn't loaded
        try {
            const contacts = await chatService.getAvailableContacts();
            // Ensure is_bot is correctly propagated if present in backend User schema
            setDummyContacts(contacts.map(c => ({...c, id: c.id.toString(), avatarUrl: `https://i.pravatar.cc/150?u=${c.email}` })));
        } catch (error) {
            console.error("Failed to fetch contacts for modal", error);
            setError('Could not load contacts for new chat.');
        }
    };
    fetchContacts();
  }, [user]);


  return (
    <div className="min-h-screen bg-background text-text-primary flex justify-center items-center p-0 md:p-4">
      <div className="dashboard-layout w-full h-screen md:h-[95vh] md:max-h-[900px] md:max-w-[1400px] bg-surface-1 md:rounded-2xl overflow-hidden border border-border-color shadow-custom flex">
        <aside className="sidebar w-[320px] bg-background p-6 flex flex-col border-r border-border-color">
          <div className="sidebar-header flex items-center justify-between mb-6">
            <div className="logo text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
              ChitChat AI
            </div>
            <div className="profile-actions flex items-center gap-4">
              <i className="ph-bell text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors"></i>
              <img
                src={user?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.email}`}
                alt="User Avatar"
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-primary"
                onClick={() => { logout(); navigate('/auth');}} title="Logout"
              />
            </div>
          </div>

          <div className="search-bar relative mb-6">
            <i className="ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-lg"></i>
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="chat-list-header flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chats</h2>
            <button
              onClick={openModal}
              className="new-chat-btn bg-primary text-text-primary border-none rounded-lg px-4 py-2 font-semibold cursor-pointer flex items-center gap-2 hover:bg-primary-light transition-colors"
            >
              <i className="ph-plus text-xl"></i> New
            </button>
          </div>
          {error && <p className='text-red-500 text-sm py-2 text-center'>{error}</p>}
          {isLoadingChats ? <LoadingSpinner /> : <ChatList chats={chats} onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />}
        </aside>

        <main className="main-content flex-grow flex flex-col items-center justify-center text-center p-10 bg-surface-1">
            <i className="ph-chats-teardrop text-6xl text-primary opacity-50 mb-5"></i>
            <h2 className="text-3xl font-semibold mb-2">Welcome to ChitChat AI</h2>
            <p className="text-text-secondary max-w-md">
              Select a conversation from the list on the left to start chatting, or create a new chat to connect with your friends and the Gemini bot.
            </p>
        </main>
      </div>

      {isModalOpen && <NewChatModal isOpen={isModalOpen} onClose={closeModal} onStartChat={handleStartChat} contacts={dummyContacts} />}
    </div>
  );
}

export default DashboardPage;
