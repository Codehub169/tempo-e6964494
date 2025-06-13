import React, { useState, useRef, useEffect } from 'react';
import { PhPaperclip, PhSmiley, PhPaperPlaneTilt } from 'phosphor-react';

const MessageInput = ({ onSendMessage, placeholder = 'Type a message...' }) => {
  const [messageText, setMessageText] = useState('');
  const textareaRef = useRef(null);

  const handleInputChange = (event) => {
    setMessageText(event.target.value);
  };

  const handleSend = () => {
    if (messageText.trim() === '') return;
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // Auto-resize textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [messageText]);

  return (
    <footer className="chat-input-area bg-background p-4 md:p-5 border-t border-border-color flex items-end gap-3 md:gap-4 shrink-0">
      <button className="p-2 text-text-secondary hover:text-primary transition-colors">
        <PhPaperclip size={22} weight="regular" />
      </button>
      
      <textarea
        ref={textareaRef}
        value={messageText}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        rows="1"
        className="chat-input flex-grow bg-surface-1 border border-border-color rounded-xl md:rounded-2xl px-4 py-2.5 text-text-primary text-sm md:text-base resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary max-h-32 overflow-y-auto"
      />
      
      <button className="p-2 text-text-secondary hover:text-primary transition-colors">
        <PhSmiley size={22} weight="regular" />
      </button>
      <button 
        onClick={handleSend}
        className="send-btn bg-primary text-text-primary w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-colors hover:bg-primary-light disabled:bg-surface-2 disabled:text-text-secondary"
        disabled={messageText.trim() === ''}
      >
        <PhPaperPlaneTilt size={20} weight="fill" />
      </button>
    </footer>
  );
};

export default MessageInput;
