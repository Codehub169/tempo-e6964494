import React, { useState } from 'react';
import ChatList from '../components/dashboard/ChatList';
import NewChatModal from '../components/dashboard/NewChatModal'; // Placeholder, will be created later

// DashboardPage component: Main interface after user logs in.
// Displays chat list, main content area, and handles new chat modal.
function DashboardPage() {
  // State to manage the visibility of the NewChatModal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the currently selected chat (ID or object). For now, null.
  const [selectedChat, setSelectedChat] = useState(null); // Later, this could be a chat ID or object

  // Dummy data for chat list - will be replaced with API data
  const dummyChats = [
    {
      id: 'group1',
      name: 'Design Team',
      lastMessage: 'Bot: Here\'s the color palette...',
      timestamp: '10:42 AM',
      unreadCount: 3,
      avatarUrl: 'https://i.pravatar.cc/150?u=group1',
      type: 'group',
      isActive: true, // Example: Mark this chat as active
    },
    {
      id: 'user1',
      name: 'Jane Doe',
      lastMessage: 'Sounds good, I\'ll review it.',
      timestamp: '9:58 AM',
      avatarUrl: 'https://i.pravatar.cc/150?u=jane',
      status: 'online',
      type: 'user',
    },
    {
      id: 'bot1',
      name: 'Gemini Bot',
      lastMessage: 'I can help with that. What\'s the topic?',
      timestamp: 'Yesterday',
      avatarUrl: 'https://i.pravatar.cc/150?u=gemini',
      isBot: true,
      type: 'bot',
    },
    {
      id: 'user2',
      name: 'Alex Ray',
      lastMessage: 'See you then!',
      timestamp: 'Yesterday',
      avatarUrl: 'https://i.pravatar.cc/150?u=alex',
      type: 'user',
    },
  ];

  // Function to open the new chat modal
  const openModal = () => setIsModalOpen(true);
  // Function to close the new chat modal
  const closeModal = () => setIsModalOpen(false);

  // Function to handle chat selection
  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
    // In a real app, this would likely fetch chat messages or navigate to a chat room view.
    console.log('Selected chat:', chatId);
  };

  return (
    // Main container for the dashboard page
    // Uses flexbox to center the dashboard layout on the screen
    <div className="min-h-screen bg-background text-text-primary flex justify-center items-center p-0 md:p-4">
      {/* Dashboard layout with sidebar and main content area */}
      <div className="dashboard-layout w-full h-screen md:h-[95vh] md:max-h-[900px] md:max-w-[1400px] bg-surface-1 md:rounded-2xl overflow-hidden border border-border-color shadow-custom flex">
        {/* Sidebar for chat list, profile, search, and new chat button */}
        <aside className="sidebar w-[320px] bg-background p-6 flex flex-col border-r border-border-color">
          {/* Sidebar header with logo and profile actions */}
          <div className="sidebar-header flex items-center justify-between mb-6">
            <div className="logo text-2xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
              ChitChat AI
            </div>
            <div className="profile-actions flex items-center gap-4">
              <i className="ph-bell text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors"></i>
              <img
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d" // Placeholder user avatar
                alt="User Avatar"
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-primary"
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="search-bar relative mb-6">
            <i className="ph-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-lg"></i>
            <input
              type="text"
              placeholder="Search chats or contacts..."
              className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Chat list header with title and new chat button */}
          <div className="chat-list-header flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chats</h2>
            <button
              onClick={openModal}
              className="new-chat-btn bg-primary text-text-primary border-none rounded-lg px-4 py-2 font-semibold cursor-pointer flex items-center gap-2 hover:bg-primary-light transition-colors"
            >
              <i className="ph-plus text-xl"></i> New
            </button>
          </div>

          {/* ChatList component to display ongoing conversations */}
          <ChatList chats={dummyChats} onSelectChat={handleSelectChat} selectedChatId={selectedChat} />
        </aside>

        {/* Main content area */}
        {/* This area will display either a welcome message or the selected ChatRoomPage */}
        <main className="main-content flex-grow flex flex-col items-center justify-center text-center p-10 bg-surface-1">
          {selectedChat ? (
            // If a chat is selected, this is where ChatRoomPage would be rendered.
            // For now, it's a placeholder message.
            <div>
              <h2 className="text-2xl font-semibold mb-2">Chat Room for {selectedChat}</h2>
              <p className="text-text-secondary">Message history and input will appear here.</p>
            </div>
          ) : (
            // Default welcome message when no chat is selected
            <>
              <i className="ph-chats-teardrop text-6xl text-primary opacity-50 mb-5"></i>
              <h2 className="text-3xl font-semibold mb-2">Welcome to ChitChat AI</h2>
              <p className="text-text-secondary max-w-md">
                Select a conversation from the list on the left to start chatting, or create a new chat to connect with your friends and the Gemini bot.
              </p>
            </>
          )}
        </main>
      </div>

      {/* NewChatModal component, visibility controlled by isModalOpen state */}
      {/* The actual NewChatModal component will be built in a subsequent step */}
      {isModalOpen && <NewChatModal onClose={closeModal} />}
    </div>
  );
}

export default DashboardPage;
