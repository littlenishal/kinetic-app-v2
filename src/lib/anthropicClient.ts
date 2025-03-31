import { supabase } from './supabaseClient';

// Define the base URL for Supabase Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/anthropic`;

// Define message types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Define context for Model Context Protocol
export interface AssistantContext {
  familyName?: string;
  familyMembers?: Array<{
    id: string;
    name: string;
    role: 'parent' | 'child' | 'other';
  }>;
  events?: Array<{
    id: string;
    summary: string;
    start: { dateTime: string };
    end: { dateTime: string };
    attendees?: Array<{ email: string; displayName?: string }>;
  }>;
  todos?: Array<{
    id: string;
    title: string;
    assignedTo?: string;
    dueDate?: string;
    completed: boolean;
  }>;
  chores?: Array<{
    id: string;
    title: string;
    assignedTo?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastCompleted?: string;
  }>;
}

// Helper function to make authenticated requests to Edge Functions
const callEdgeFunction = async (functionName: string, payload: any) => {
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Make the request to the Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unknown error occurred');
    }

    return response.json();
  } catch (error) {
    console.error(`Error calling Edge Function ${functionName}:`, error);
    throw error;
  }
};

// Conversation function using Model Context Protocol via Edge Function
export const generateResponse = async (
  messages: Message[],
  context: AssistantContext
): Promise<string> => {
  try {
    // Format messages for Anthropic API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call the Edge Function
    const result = await callEdgeFunction('anthropic', {
      method: 'generateResponse',
      body: {
        messages: formattedMessages,
        context
      }
    });

    return result;
  } catch (error) {
    console.error('Error generating response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
};

// Function to extract calendar commands from user messages via Edge Function
export const extractCalendarCommand = async (
  userMessage: string
): Promise<{ 
  command: 'create' | 'update' | 'delete' | 'query' | null;
  eventDetails: Record<string, any> | null;
}> => {
  try {
    // Call the Edge Function
    const result = await callEdgeFunction('anthropic', {
      method: 'extractCalendarCommand',
      body: {
        userMessage
      }
    });

    return result;
  } catch (error) {
    console.error('Error extracting calendar command:', error);
    return { command: null, eventDetails: null };
  }
};