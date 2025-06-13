import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Smiley, PaperPlaneTilt } from 'phosphor-react';

const MessageInput = ({ onSendMessage, onTypingChange, placeholder = 'Type a message...' }) => {
  const [messageText, setMessageText] = useState('');
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (event) => {
    setMessageText(event.target.value);
    if (onTypingChange) {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        onTypingChange(true); // Signal typing started
        typingTimeoutRef.current = setTimeout(() => {
            onTypingChange(false); // Signal typing stopped after a delay
        }, 1500); // Adjust delay as needed
    }
  };

  const handleSend = () => {
    if (messageText.trim() === '') return;
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    if(onTypingChange) onTypingChange(false); // Ensure typing indicator is off
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    }
  }, [messageText]);

  return (
    <footer className="chat-input-area bg-background p-4 md:p-5 border-t border-border-color flex items-end gap-3 md:gap-4 shrink-0">
      <button className="p-2 text-text-secondary hover:text-primary transition-colors">
        <Paperclip size={22} weight="regular" />
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
        <Smiley size={22} weight="regular" />
      </button>
      <button 
        onClick={handleSend}
        className="send-btn bg-primary text-text-primary w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-colors hover:bg-primary-light disabled:bg-surface-2 disabled:text-text-secondary"
        disabled={messageText.trim() === ''}
      >
        <PaperPlaneTilt size={20} weight="fill" />
      </button>
    </footer>
  );
};

export default MessageInput;
