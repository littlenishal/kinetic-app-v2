import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import MessageBubble from './MessageBubble';
import CalendarEmbed from './CalendarEmbed';
import SuggestionChips from './SuggestionChips';
import { PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

const ConversationalInterface: React.FC = () => {
  const { messages, isLoading, sendMessage } = useChat();
  const [inputValue, setInputValue] = useState<string>('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if speech recognition is available
  useEffect(() => {
    const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 
                                         'webkitSpeechRecognition' in window;
    setIsSpeechEnabled(isSpeechRecognitionSupported);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle send message
  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    
    await sendMessage(inputValue);
    setInputValue('');
  };
  
  // Handle input key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle voice input
  const handleVoiceInput = () => {
    if (!isSpeechEnabled) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Common suggestions based on the app's functionality
  const commonSuggestions = [
    "What's on our schedule this weekend?",
    "Add soccer practice on Thursdays at 4pm",
    "Show me Emma's activities for next week",
    "Remind me about doctor appointments",
    "What chores are due today?"
  ];
  
  // Render message list with embedded components
  const renderMessages = () => {
    return messages.map((message) => (
      <MessageBubble
        key={message.id}
        message={message}
        renderEmbeds={(content) => {
          // Check for calendar view requests
          if (content.includes('calendar') || content.includes('schedule')) {
            return <CalendarEmbed />;
          }
          return null;
        }}
      />
    ));
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-neutral-700">
              Welcome to your Family Calendar Assistant
            </h3>
            <p className="text-neutral-500 mt-2">
              Ask me anything about your family schedule, to-dos, or chores.
            </p>
          </div>
        )}
        
        {/* Message list */}
        {renderMessages()}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-neutral-500">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150"></div>
          </div>
        )}
        
        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <SuggestionChips 
            suggestions={commonSuggestions} 
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      )}
      
      {/* Input area */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 py-2 px-4 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
          
          {/* Voice input button */}
          {isSpeechEnabled && (
            <button
              onClick={handleVoiceInput}
              disabled={isLoading || isListening}
              className={`p-2 rounded-full ${
                isListening 
                  ? 'bg-accent-red text-white' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
              aria-label="Voice input"
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}
          
          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === '' || isLoading}
            className={`p-2 rounded-full ${
              inputValue.trim() === '' || isLoading
                ? 'bg-neutral-100 text-neutral-400'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationalInterface;