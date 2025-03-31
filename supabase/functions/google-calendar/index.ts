// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Google API client libraries
import { OAuth2Client } from 'npm:google-auth-library'
import { calendar_v3, google } from 'npm:googleapis'

// Get environment variables
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const REDIRECT_URI = Deno.env.get('REDIRECT_URI') 

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google API credentials environment variables')
}

// Create OAuth2 client
const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method, body } = await req.json()

    if (!method || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set up Google Calendar API client
    const accessToken = body.accessToken
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    oAuth2Client.setCredentials({ access_token: accessToken })
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

    // Handle different methods
    let result
    switch (method) {
      case 'getCalendarList':
        result = await getCalendarList(calendar)
        break

      case 'getEvents':
        const { calendarId, timeMin, timeMax, maxResults } = body
        result = await getEvents(calendar, calendarId, timeMin, timeMax, maxResults)
        break

      case 'createEvent':
        const { calendarId: createCalendarId, event } = body
        result = await createEvent(calendar, createCalendarId, event)
        break

      case 'updateEvent':
        const { calendarId: updateCalendarId, eventId, event: updatedEvent } = body
        result = await updateEvent(calendar, updateCalendarId, eventId, updatedEvent)
        break

      case 'deleteEvent':
        const { calendarId: deleteCalendarId, eventId: deleteEventId } = body
        result = await deleteEvent(calendar, deleteCalendarId, deleteEventId)
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid method' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to get the list of calendars
async function getCalendarList(calendar: calendar_v3.Calendar) {
  try {
    const response = await calendar.calendarList.list()
    return response.data.items
  } catch (error) {
    console.error('Error getting calendar list:', error)
    throw new Error('Failed to get calendar list')
  }
}

// Function to get events from a calendar
async function getEvents(
  calendar: calendar_v3.Calendar,
  calendarId: string, 
  timeMin: string, 
  timeMax: string,
  maxResults = 100
) {
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    })
    return response.data.items
  } catch (error) {
    console.error(`Error getting events for calendar ${calendarId}:`, error)
    throw new Error(`Failed to get events for calendar ${calendarId}`)
  }
}

// Function to create a new event
async function createEvent(
  calendar: calendar_v3.Calendar,
  calendarId: string, 
  event: any
) {
  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })
    return response.data
  } catch (error) {
    console.error(`Error creating event in calendar ${calendarId}:`, error)
    throw new Error(`Failed to create event in calendar ${calendarId}`)
  }
}

// Function to update an existing event
async function updateEvent(
  calendar: calendar_v3.Calendar,
  calendarId: string, 
  eventId: string, 
  event: any
) {
  try {
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    })
    return response.data
  } catch (error) {
    console.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error)
    throw new Error(`Failed to update event ${eventId} in calendar ${calendarId}`)
  }
}

// Function to delete an event
async function deleteEvent(
  calendar: calendar_v3.Calendar,
  calendarId: string, 
  eventId: string
) {
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    })
    return { success: true }
  } catch (error) {
    console.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error)
    throw new Error(`Failed to delete event ${eventId} from calendar ${calendarId}`)
  }
}