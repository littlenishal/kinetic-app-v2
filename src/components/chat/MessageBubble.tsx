import React from 'react';
import { format } from 'date-fns';

interface MessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  };
  renderEmbeds?: (content: string) => React.ReactNode;
}

const MessageBubble: React.FC<MessageProps> = ({ message, renderEmbeds }) => {
  const { role, content, timestamp } = message;
  const isUser = role === 'user';
  
  // Format the timestamp
  const formattedTime = format(new Date(timestamp), 'h:mm a');
  
  // Replace newlines with JSX breaks
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  // Process content to find special commands or embeds
  
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 ${
          isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
        }`}
      >
        {/* Message content */}
        <div className="text-sm md:text-base">
          {formatMessageText(content)}
        </div>
        
        {/* Embedded components if any */}
        {renderEmbeds && renderEmbeds(content)}
        
        {/* Timestamp */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-neutral-500'
          }`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;