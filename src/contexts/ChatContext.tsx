import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateResponse, extractCalendarCommand, Message, AssistantContext } from '../lib/anthropicClient';
import { useAuth } from './AuthContext';
import { useCalendar } from './CalendarContext';
import { supabase } from '../lib/supabaseClient';

interface ChatMessage extends Message {
  id: string;
  timestamp: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, currentFamily, familyMembers } = useAuth();
  const { events, addEvent, calendars } = useCalendar();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load chat history when user or family changes
  useEffect(() => {
    if (user && currentFamily) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [user, currentFamily]);

  // Load chat history from database
  const loadChatHistory = async () => {
    if (!user || !currentFamily) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('family_id', currentFamily.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      
      if (data) {
        const formattedMessages: ChatMessage[] = [];
        
        for (const item of data) {
          // Add user message
          formattedMessages.push({
            id: `user-${item.id}`,
            role: 'user',
            content: item.message,
            timestamp: new Date(item.created_at).getTime()
          });
          
          // Add assistant response
          formattedMessages.push({
            id: `assistant-${item.id}`,
            role: 'assistant',
            content: item.response,
            timestamp: new Date(item.created_at).getTime() + 1 // +1 to ensure order
          });
        }
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message to the assistant
  const sendMessage = async (content: string) => {
    if (!user || !currentFamily) return;
    
    try {
      setIsLoading(true);
      
      // Add user message
      const userMessageId = uuidv4();
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Check if the message contains a calendar command
      const commandResult = await extractCalendarCommand(content);
      
      // Prepare context for the AI assistant
      const context: AssistantContext = {
        familyName: currentFamily.name,
        familyMembers: familyMembers.map(member => ({
          id: member.id,
          name: member.profile?.full_name || 'Unknown',
          role: member.role
        })),
        events: events.map(event => ({
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          attendees: event.attendees
        }))
      };
      
      // Load to-dos and chores for context
      if (currentFamily) {
        // Load to-dos
        const { data: todosData } = await supabase
          .from('todos')
          .select('*')
          .eq('family_id', currentFamily.id)
          .order('due_date', { ascending: true });
        
        if (todosData) {
          context.todos = todosData.map(todo => ({
            id: todo.id,
            title: todo.title,
            assignedTo: todo.assigned_to ?? undefined,
            dueDate: todo.due_date ?? undefined,
            completed: todo.status === 'completed'
          }));
        }
        
        // Load chores
        const { data: choresData } = await supabase
          .from('chores')
          .select('*')
          .eq('family_id', currentFamily.id);
        
        if (choresData) {
          context.chores = choresData.map(chore => ({
            id: chore.id,
            title: chore.title,
            assignedTo: chore.assigned_to ?? undefined,
            frequency: chore.frequency,
            lastCompleted: chore.last_completed ?? undefined
          }));
        }
      }
      
      // Get previous messages for context (limit to last 10)
      const conversationHistory = messages
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));
      
      // Add the new user message
      conversationHistory.push({ role: 'user', content });
      
      // Handle calendar commands before sending to Claude
      if (commandResult.command && commandResult.eventDetails) {
        try {
          switch (commandResult.command) {
            case 'create':
              // Format event for Google Calendar
              if (commandResult.eventDetails.summary && 
                  commandResult.eventDetails.start && 
                  commandResult.eventDetails.end) {
                
                const calendarId = calendars.find(c => c.primary)?.id || 'primary';
                
                await addEvent({
                  calendarId,
                  summary: commandResult.eventDetails.summary,
                  description: commandResult.eventDetails.description,
                  start: {
                    dateTime: new Date(commandResult.eventDetails.start).toISOString(),
                  },
                  end: {
                    dateTime: new Date(commandResult.eventDetails.end).toISOString(),
                  },
                  location: commandResult.eventDetails.location,
                  attendees: commandResult.eventDetails.attendees
                });
              }
              break;
              
            case 'update':
              // Would need to find the event first, then update it
              // This is a simplification - would need more logic to find the right event
              break;
              
            case 'delete':
              // Would need to find the event first, then delete it
              // This is a simplification - would need more logic to find the right event
              break;
            
            default:
              break;
          }
        } catch (error) {
          console.error('Error handling calendar command:', error);
        }
      }
      
      // Generate AI response
      const response = await generateResponse(conversationHistory, context);
      
      // Save to database
      const { error: dbError } = await supabase
        .from('chat_history')
        .insert([{
          family_id: currentFamily.id,
          user_id: user.id,
          message: content,
          response
        }]);
      
      if (dbError) throw dbError;
      
      // Add assistant message
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessageId = uuidv4();
      const errorMessage: ChatMessage = {
        id: errorMessageId,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  const value = {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}