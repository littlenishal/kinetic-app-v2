import { supabase } from './supabaseClient';

// Define the base URL for Supabase Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/google-calendar`;

// Helper to get the current authenticated user's access token
export const getGoogleAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Ensure we have a valid session and provider token
  if (!session?.provider_token) {
    console.error('No provider token available');
    return null;
  }
  
  return session.provider_token;
};

// Helper function to make authenticated requests to Edge Functions
const callEdgeFunction = async (method: string, body: any) => {
  try {
    // Get the current session token for Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseToken = session?.access_token;

    // Get Google access token
    const googleToken = await getGoogleAccessToken();

    if (!supabaseToken || !googleToken) {
      throw new Error('Authentication tokens not available');
    }

    // Make the request to the Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseToken}`,
      },
      body: JSON.stringify({
        method,
        body: {
          ...body,
          accessToken: googleToken
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unknown error occurred');
    }

    return response.json();
  } catch (error) {
    console.error(`Error calling Google Calendar Edge Function:`, error);
    throw error;
  }
};

// Get a list of the user's calendars
export const getCalendarList = async () => {
  try {
    return await callEdgeFunction('getCalendarList', {});
  } catch (error) {
    console.error('Error getting calendar list:', error);
    throw error;
  }
};

// Get events from a specific calendar
export const getEvents = async (
  calendarId: string, 
  timeMin: string, 
  timeMax: string,
  maxResults = 100
) => {
  try {
    return await callEdgeFunction('getEvents', {
      calendarId,
      timeMin,
      timeMax,
      maxResults
    });
  } catch (error) {
    console.error(`Error getting events for calendar ${calendarId}:`, error);
    throw error;
  }
};

// Create a new event
export const createEvent = async (calendarId: string, event: any) => {
  try {
    return await callEdgeFunction('createEvent', {
      calendarId,
      event
    });
  } catch (error) {
    console.error(`Error creating event in calendar ${calendarId}:`, error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (calendarId: string, eventId: string, event: any) => {
  try {
    return await callEdgeFunction('updateEvent', {
      calendarId,
      eventId,
      event
    });
  } catch (error) {
    console.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (calendarId: string, eventId: string) => {
  try {
    return await callEdgeFunction('deleteEvent', {
      calendarId,
      eventId
    });
  } catch (error) {
    console.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
    throw error;
  }
};

// Helper function to convert natural language to date ranges
export const getNaturalDateRange = (query: string): { timeMin: string, timeMax: string } => {
  const now = new Date();
  let timeMin = new Date(now);
  let timeMax = new Date(now);
  
  // Default to today
  timeMin.setHours(0, 0, 0, 0);
  timeMax.setHours(23, 59, 59, 999);
  
  // Parse common time ranges
  if (query.includes('tomorrow')) {
    timeMin.setDate(timeMin.getDate() + 1);
    timeMax.setDate(timeMax.getDate() + 1);
  } else if (query.includes('weekend')) {
    // Set to next Saturday-Sunday if it's already weekend, otherwise this weekend
    const day = timeMin.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSaturday = day === 0 || day === 6 ? 6 - day + 7 : 6 - day;
    
    timeMin.setDate(timeMin.getDate() + daysToSaturday);
    timeMin.setHours(0, 0, 0, 0);
    
    timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 1); // Sunday
    timeMax.setHours(23, 59, 59, 999);
  } else if (query.includes('week')) {
    // Start of current week (Monday)
    const day = timeMin.getDay(); // 0 = Sunday, 1 = Monday
    const daysToMonday = day === 0 ? -6 : 1 - day;
    
    timeMin.setDate(timeMin.getDate() + daysToMonday);
    timeMin.setHours(0, 0, 0, 0);
    
    timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 6); // Sunday
    timeMax.setHours(23, 59, 59, 999);
  } else if (query.includes('month')) {
    // Start of current month
    timeMin.setDate(1);
    timeMin.setHours(0, 0, 0, 0);
    
    // End of current month
    timeMax = new Date(timeMin.getFullYear(), timeMin.getMonth() + 1, 0);
    timeMax.setHours(23, 59, 59, 999);
  }
  
  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  };
};