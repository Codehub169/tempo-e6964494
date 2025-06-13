import React from 'react';
import ChatItem from './ChatItem'; // ChatItem will be created in a subsequent step

// ChatList component: Displays a list of chat conversations.
// Takes an array of chat objects and a selection handler as props.
function ChatList({ chats, onSelectChat, selectedChatId }) {
  if (!chats || chats.length === 0) {
    return <p className="text-text-secondary text-center py-4">No active chats.</p>;
  }

  return (
    // Container for the list of chat items
    // Allows vertical scrolling if the list exceeds available space
    <div className="chat-list flex-grow overflow-y-auto flex flex-col gap-2.5 pr-1">
      {/* Map through the chats array and render a ChatItem for each one */}
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={selectedChatId === chat.id} // Determine if this chat is currently selected
          onSelect={() => onSelectChat(chat.id)}
        />
      ))}
    </div>
  );
}

export default ChatList;
