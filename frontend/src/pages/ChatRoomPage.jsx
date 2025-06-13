import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // Assuming usage with React Router for chat ID

// ChatRoomPage component: Displays the actual chat interface for a selected conversation.
// This component handles message display, input, and simulates real-time interaction.
function ChatRoomPage() {
  // useParams could be used if chat ID comes from URL, e.g., /chat/:chatId
  // const { chatId } = useParams(); 
  // For now, let's assume chat details are passed as props or fetched based on an ID.
  // This is a simplified version based on chatroom_group.html, chatroom_user.html, chatroom_bot.html.

  // Dummy chat data - in a real app, this would come from an API based on chatId or props
  const [chatDetails, setChatDetails] = useState({
    id: 'group1', // Example chat ID
    name: 'Design Team',
    participants: 'You, Jane, Alex, and Gemini Bot',
    avatarUrl: 'https://i.pravatar.cc/150?u=group1',
    type: 'group', // 'group', 'user', or 'bot'
  });

  // State for messages in the current chat room
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'Jane Doe',
      text: 'Hey team, I\'ve pushed the latest mockups for the dashboard. Let me know what you think!',
      time: '10:35 AM',
      avatarUrl: 'https://i.pravatar.cc/150?u=jane',
      type: 'received',
    },
    {
      id: 'm2',
      sender: 'You',
      text: 'Awesome, taking a look now. @Gemini Bot can you suggest a modern and accessible color palette for a dashboard UI?',
      time: '10:36 AM',
      type: 'sent',
    },
    {
      id: 'm3',
      sender: 'Gemini Bot',
      text: 'Of course! Here is a modern and accessible color palette suggestion: <br>\u2022 Primary: #6a5af9 (Vibrant Purple) <br>\u2022 Background: #121212 (Dark Charcoal) <br>\u2022 Surface: #1e1e1e (Slightly Lighter Gray) <br>\u2022 Text Primary: #FFFFFF (White) <br>\u2022 Text Secondary: #a0a0a0 (Light Gray) <br>This combination provides high contrast and a clean, modern feel.',
      time: '10:37 AM',
      avatarUrl: 'https://i.pravatar.cc/150?u=gemini',
      isBot: true,
      type: 'received',
    },
    {
      id: 'm4',
      sender: 'Alex Ray',
      text: 'I like that palette! It matches our brand identity well. Let\'s go with that. The mockups look great, Jane.',
      time: '10:41 AM',
      avatarUrl: 'https://i.pravatar.cc/150?u=alex',
      type: 'received',
    },
  ]);

  // State for the message input field
  const [newMessage, setNewMessage] = useState('');
  // State for typing indicator visibility
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null); // Ref to scroll to the bottom of messages
  const textareaRef = useRef(null); // Ref for the textarea to manage its height

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // Function to handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const messageToSend = {
      id: `m${messages.length + 1}`,
      sender: 'You', // Assuming the current user is sending
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sent',
    };
    setMessages((prevMessages) => [...prevMessages, messageToSend]);
    setNewMessage('');

    // Simulate bot response if mentioned (very basic simulation)
    if (newMessage.toLowerCase().includes('@gemini') || chatDetails.type === 'bot') {
      setIsTyping(true);
      setTimeout(() => {
        const botResponse = {
          id: `m${messages.length + 2}`,
          sender: 'Gemini Bot',
          text: "I'm processing that. One moment...",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatarUrl: 'https://i.pravatar.cc/150?u=gemini',
          isBot: true,
          type: 'received',
        };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
        setIsTyping(false);
      }, 2000);
    }
  };
  
  // Determine avatar properties based on chat type
  let headerAvatarSpecifics = {};
  if (chatDetails.type === 'bot') {
    headerAvatarSpecifics.isBot = true;
  } else if (chatDetails.type === 'user') {
    headerAvatarSpecifics.status = 'online'; // Example status
  }

  // This component would typically be part of the DashboardPage layout, replacing the welcome message.
  // For standalone testing or routing, it can be structured like this.
  return (
    <div className="chat-container w-full h-full bg-surface-1 flex flex-col overflow-hidden">
      {/* Chat header: Displays information about the current chat */}
      <header className="chat-header flex items-center p-4 md:p-6 bg-background border-b border-border-color flex-shrink-0">
        {/* Back button - links to dashboard or previous view */}
        {/* This Link might need adjustment depending on routing setup */}
        <Link to="/dashboard" className="back-btn text-text-primary text-2xl mr-4 hover:text-primary">
          <i className="ph-arrow-left"></i>
        </Link>
        <div className="chat-header-avatar relative mr-4">
          <img 
            src={chatDetails.avatarUrl} 
            alt={`${chatDetails.name} Avatar`} 
            className={`w-11 h-11 rounded-full ${chatDetails.type === 'bot' ? 'border-2 border-primary' : ''}`}
          />
          {headerAvatarSpecifics.isBot && (
            <div className="bot-indicator absolute bottom-[-2px] right-[-2px] w-5 h-5 bg-primary border-2 border-background rounded-full flex items-center justify-center">
              <i className="ph-robot text-xs text-text-primary"></i>
            </div>
          )}
          {headerAvatarSpecifics.status && (
             <span className="status absolute bottom-0.5 right-0.5 w-3 h-3 bg-green border-2 border-background rounded-full"></span>
          )}
        </div>
        <div className="chat-header-info flex-grow">
          <h2 className="text-lg font-semibold">{chatDetails.name}</h2>
          <p className={`text-sm ${chatDetails.type === 'user' && headerAvatarSpecifics.status === 'online' ? 'text-green' : 'text-text-secondary'}`}>
            {chatDetails.type === 'bot' ? `Model: ${chatDetails.participants || 'gemini-2.5-flash-preview-05-20'}` : chatDetails.participants}
          </p>
        </div>
        <div className="chat-header-actions flex gap-5">
          {chatDetails.type !== 'bot' && <i className="ph-phone text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors"></i>}
          {chatDetails.type !== 'bot' && <i className="ph-video-camera text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors"></i>}
          <i className={`${chatDetails.type === 'bot' ? 'ph-dots-three-outline-vertical-fill' : 'ph-info'} text-2xl text-text-secondary cursor-pointer hover:text-primary transition-colors`}></i>
        </div>
      </header>

      {/* Chat messages area: Displays the conversation history */}
      <main className="chat-messages flex-grow overflow-y-auto p-4 md:p-7 flex flex-col gap-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message flex max-w-[70%] items-end gap-2.5 ${msg.type === 'sent' ? 'self-end flex-row-reverse' : 'self-start'}`}
          >
            {msg.type === 'received' && msg.avatarUrl && (
              <img 
                src={msg.avatarUrl} 
                alt={`${msg.sender} Avatar`} 
                className={`w-9 h-9 rounded-full flex-shrink-0 ${msg.isBot ? 'border-2 border-primary' : ''}`}
              />
            )}
            <div
              className={`message-content p-3 px-4.5 rounded-2xl ${ 
                msg.type === 'sent'
                  ? 'bg-sent-bg text-text-primary rounded-br-md'
                  : 'bg-received-bg text-text-primary rounded-bl-md'
              }`}
            >
              {msg.type === 'received' && msg.sender !== 'You' && (
                <p className={`message-sender font-semibold text-sm mb-1 ${msg.isBot ? 'text-primary-light' : ''}`}>
                  {msg.sender}
                </p>
              )}
              {/* Use dangerouslySetInnerHTML for text that might contain <br> tags from bot */}
              <p className="message-text leading-normal" dangerouslySetInnerHTML={{ __html: msg.text }}></p>
              <p className="message-time text-xs text-text-secondary mt-1.5 ${msg.type === 'sent' ? 'text-right' : ''}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="message received self-start flex items-end gap-2.5">
            <img src="https://i.pravatar.cc/150?u=gemini" alt="Bot Typing Avatar" className="w-9 h-9 rounded-full border-2 border-primary" />
            <div className="typing-indicator flex items-center gap-1 p-3 px-4.5 bg-received-bg rounded-2xl rounded-bl-md">
              <span className="h-2 w-2 bg-text-secondary rounded-full opacity-40 animate-[typing_1s_infinite_0s]"></span>
              <span className="h-2 w-2 bg-text-secondary rounded-full opacity-40 animate-[typing_1s_infinite_0.2s]"></span>
              <span className="h-2 w-2 bg-text-secondary rounded-full opacity-40 animate-[typing_1s_infinite_0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </main>

      {/* Chat input area: For typing and sending messages */}
      <footer className="chat-input-area p-5 md:p-6 bg-background border-t border-border-color flex items-center gap-4 flex-shrink-0">
        <button className="text-2xl text-text-secondary hover:text-primary transition-colors">
          <i className="ph-paperclip"></i>
        </button>
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`Message ${chatDetails.name}...`}
          rows="1"
          className="chat-input flex-grow bg-surface-1 border border-border-color rounded-xl p-3.5 px-5 text-text-primary text-base resize-none max-h-32 focus:outline-none focus:border-primary"
        ></textarea>
        <button className="text-2xl text-text-secondary hover:text-primary transition-colors">
          <i className="ph-smiley"></i>
        </button>
        <button
          onClick={handleSendMessage}
          className="send-btn bg-primary text-text-primary w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary-light transition-colors text-2xl"
        >
          <i className="ph-paper-plane-tilt"></i>
        </button>
      </footer>
      {/* Add keyframes for typing animation in a <style> tag or a CSS file */}
      <style jsx global>{`
        @keyframes typing {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-\[typing_1s_infinite_0s\] { animation: typing 1s infinite 0s; }
        .animate-\[typing_1s_infinite_0.2s\] { animation: typing 1s infinite 0.2s; }
        .animate-\[typing_1s_infinite_0.4s\] { animation: typing 1s infinite 0.4s; }
      `}</style>
    </div>
  );
}

export default ChatRoomPage;
