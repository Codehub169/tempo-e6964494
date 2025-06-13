import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { PhRobot } from 'phosphor-react';

const MessageView = ({ messages, typingUsers = [], currentUserId = 'currentUser' }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]); // Scroll on new messages or typing status change

  // Assuming currentUserId is passed to determine 'sent' or 'received'
  // And message object has a structure like: { id, sender: { id, name, avatarUrl, isBot }, text, time, type (optional, can be derived) }

  return (
    <main className="chat-messages flex-grow overflow-y-auto p-4 md:p-7 flex flex-col gap-3 md:gap-5">
      {messages.map((msg, index) => {
        // Determine message type (sent, received, bot)
        let messageType = 'received';
        if (msg.sender && msg.sender.id === currentUserId) {
          messageType = 'sent';
        } else if (msg.sender && msg.sender.isBot) {
          messageType = 'bot';
        }
        
        // Fallback for sender if not present (e.g. system message, though not planned)
        const sender = msg.sender || { id: 'unknown', name: 'Unknown', avatarUrl: `https://i.pravatar.cc/150?u=unknown${index}`, isBot: false };

        return (
          <MessageItem
            key={msg.id || index} // Use msg.id if available, otherwise index as fallback
            message={{ ...msg, sender }} // Ensure sender object is always passed
            type={messageType}
          />
        );
      })}

      {typingUsers.map(user => (
        user && user.name && (
        <div key={`typing-${user.id || user.name}`} className="message received flex items-end gap-2.5 self-start max-w-[70%]">
          {user.avatarUrl && (
            <div className="message-avatar shrink-0">
              <img src={user.avatarUrl} alt={`${user.name} Avatar`} className={`w-8 h-8 md:w-9 md:h-9 rounded-full object-cover ${user.isBot ? 'border-2 border-primary' : ''}`} />
            </div>
          )}
          <div className="message-content bg-received-bg px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl rounded-bl-md">
            <div className="typing-indicator flex items-center gap-1.5">
              <span className="h-2 w-2 bg-text-secondary rounded-full opacity-40 animate-typing"></span>
              <span className="h-2 w-2 bg-text-secondary rounded-full opacity-40 animate-typing animation-delay-200"></span>
              <span className="h-2 w-2 bg-text-secondary rounded-full opacity-40 animate-typing animation-delay-400"></span>
            </div>
          </div>
        </div>
        )
      ))}
      <div ref={messagesEndRef} />
      {/* Inline style for keyframes as it's cleaner than global CSS for component-specific animation */}
      <style jsx global>{`
        @keyframes typing {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-typing {
          animation: typing 1.2s infinite ease-in-out;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </main>
  );
};

export default MessageView;
