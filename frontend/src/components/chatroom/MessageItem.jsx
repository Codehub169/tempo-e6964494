import React from 'react';
import { Robot } from 'phosphor-react'; // Changed PhRobot to Robot

const MessageItem = ({ message, type /* 'sent', 'received', 'bot' */ }) => {
  const { text, time, sender, isHtml } = message;
  const { name: senderName, avatarUrl, isBot: senderIsBot } = sender || {}; // Destructure sender safely

  const avatar = avatarUrl || `https://i.pravatar.cc/150?u=${sender?.id || 'default'}`;

  const messageContainerBaseClasses = 'message flex max-w-[70%] items-end gap-2.5';
  let messageContainerClasses = messageContainerBaseClasses;
  let messageContentClasses = 'message-content px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl relative text-sm md:text-base';
  let senderNameClasses = 'message-sender font-semibold text-xs md:text-sm mb-1';

  if (type === 'sent') {
    messageContainerClasses += ' self-end flex-row-reverse';
    messageContentClasses += ' bg-sent-bg text-text-primary rounded-br-md';
  } else {
    messageContainerClasses += ' self-start';
    messageContentClasses += ' bg-received-bg text-text-primary rounded-bl-md';
    if (type === 'bot') {
      senderNameClasses += ' text-primary-light';
    }
  }

  return (
    <div className={messageContainerClasses}>
      {type !== 'sent' && sender && (
        <div className="message-avatar shrink-0">
          <img 
            src={avatar} 
            alt={`${senderName || 'User'} Avatar`} 
            className={`w-8 h-8 md:w-9 md:h-9 rounded-full object-cover ${senderIsBot ? 'border-2 border-primary p-0.5' : ''}`} 
          />
        </div>
      )}
      <div className={messageContentClasses}>
        {type !== 'sent' && senderName && (
          <p className={senderNameClasses}>{senderName}</p>
        )}
        {isHtml ? (
          <div className="message-text leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          <p className="message-text leading-relaxed whitespace-pre-wrap">{text}</p>
        )}
        {time && (
          <p className="message-time text-xs text-text-secondary/80 mt-1.5 text-right">
            {time}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
