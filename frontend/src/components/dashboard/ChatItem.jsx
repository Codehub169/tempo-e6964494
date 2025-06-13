import React from 'react';
import { PhRobot, PhCheckCircle } from 'phosphor-react'; // Using react-specific icons

const ChatItem = ({ chat, onSelectChat, isSelected }) => {
  const { id, name, type, lastMessage, avatarUrl, unreadCount, timestamp, onlineStatus, members } = chat;

  const isBotChat = type === 'BOT' || (members && members.some(m => m.isBot));
  const displayAvatar = avatarUrl || `https://i.pravatar.cc/150?u=${id}`;

  // Determine chat name and details based on type
  let chatDisplayName = name;
  let lastMessageText = lastMessage?.text || 'No messages yet.';
  if (lastMessage?.senderName) {
    lastMessageText = `${lastMessage.senderName === 'You' ? 'You:' : lastMessage.senderName + ':'} ${lastMessage.text}`;
  }

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onSelectChat(id);
      }}
      className={`chat-item flex items-center p-4 rounded-xl cursor-pointer transition-colors duration-200 ease-in-out no-underline text-text-primary ${isSelected ? 'bg-surface-2 border-l-4 border-primary pl-3' : 'hover:bg-surface-2'}
      `}
    >
      <div className="avatar relative mr-4 shrink-0">
        <img src={displayAvatar} alt={`${chatDisplayName} Avatar`} className="w-12 h-12 rounded-full object-cover" />
        {isBotChat && !onlineStatus && (
          <div className="bot-indicator absolute bottom-0 right-0 w-5 h-5 bg-primary border-2 border-background rounded-full flex items-center justify-center">
            <PhRobot size={12} className="text-text-primary" weight="bold" />
          </div>
        )}
        {onlineStatus && type === 'ONE_ON_ONE' && (
          <span className="status absolute bottom-0.5 right-0.5 w-3 h-3 bg-green border-2 border-background rounded-full"></span>
        )}
      </div>
      <div className="chat-details flex-grow overflow-hidden">
        <span className="chat-name font-semibold block truncate text-sm text-text-primary">{chatDisplayName}</span>
        <p className="last-message text-text-secondary text-xs truncate">
          {lastMessageText}
        </p>
      </div>
      <div className="chat-meta text-right text-xs text-text-secondary ml-2 shrink-0">
        <div className="timestamp mb-1.5">{timestamp || '...'}</div>
        {unreadCount > 0 && (
          <div className="unread-badge bg-primary text-text-primary font-semibold py-0.5 px-2 rounded-full text-[10px]">
            {unreadCount}
          </div>
        )}
      </div>
    </a>
  );
};

export default ChatItem;
