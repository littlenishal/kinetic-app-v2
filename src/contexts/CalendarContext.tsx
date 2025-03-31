import React, { createContext, useContext, useEffect, useState } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getCalendarList, getEvents, createEvent, updateEvent, deleteEvent } from '../lib/googleCalendarClient';
import { useAuth } from './AuthContext';

// Type definitions
export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: {
    email: string;
    displayName?: string;
  }[];
  colorId?: string;
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

export type ViewType = 'day' | 'week' | 'month';

interface CalendarContextType {
  calendars: Calendar[];
  events: CalendarEvent[];
  selectedDate: Date;
  viewType: ViewType;
  isLoading: boolean;
  error: string | null;
  // Actions
  setSelectedDate: (date: Date) => void;
  setViewType: (view: ViewType) => void;
  toggleCalendarSelection: (calendarId: string) => void;
  refreshEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  editEvent: (event: CalendarEvent) => Promise<CalendarEvent>;
  removeEvent: (calendarId: string, eventId: string) => Promise<boolean>;
  getEventsForDay: (date: Date) => CalendarEvent[];
  getEventsForPeriod: (startDate: Date, endDate: Date) => CalendarEvent[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load calendars when the user changes
  useEffect(() => {
    if (user) {
      loadCalendars();
    } else {
      setCalendars([]);
      setEvents([]);
    }
  }, [user]);

  // Reload events when the date range, view type, or selected calendars change
  useEffect(() => {
    if (user && calendars.length > 0) {
      refreshEvents();
    }
  }, [user, selectedDate, viewType, calendars]);

  // Load user's calendars
  const loadCalendars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const calendarsList = await getCalendarList();
      
      if (calendarsList) {
        // Mark all calendars as selected by default
        const formattedCalendars = calendarsList.map((cal: any) => ({
          id: cal.id,
          summary: cal.summary,
          description: cal.description,
          primary: cal.primary,
          backgroundColor: cal.backgroundColor,
          foregroundColor: cal.foregroundColor,
          selected: true // All calendars selected by default
        }));
        
        setCalendars(formattedCalendars);
      }
    } catch (err) {
      console.error('Error loading calendars:', err);
      setError('Failed to load calendars');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh events for the current view
  const refreshEvents = async () => {
    if (!user || calendars.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { timeMin, timeMax } = getTimeRangeForView(selectedDate, viewType);
      
      // Only get events from selected calendars
      const selectedCalendarIds = calendars
        .filter(cal => cal.selected)
        .map(cal => cal.id);
      
      if (selectedCalendarIds.length === 0) {
        setEvents([]);
        return;
      }
      
      // Fetch events for each selected calendar
      const allEvents: CalendarEvent[] = [];
      
      for (const calendarId of selectedCalendarIds) {
        const calendarEvents = await getEvents(
          calendarId,
          timeMin.toISOString(),
          timeMax.toISOString()
        );
        
        // Format events to our internal structure
        if (calendarEvents && calendarEvents.length > 0) {
          const formattedEvents = calendarEvents.map((event: any) => ({
            id: event.id,
            calendarId,
            summary: event.summary || 'Untitled Event',
            description: event.description,
            start: event.start,
            end: event.end,
            location: event.location,
            attendees: event.attendees,
            colorId: event.colorId
          }));
          
          allEvents.push(...formattedEvents);
        }
      }
      
      setEvents(allEvents);
    } catch (err) {
      console.error('Error refreshing events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get time range for the current view
  const getTimeRangeForView = (date: Date, view: ViewType) => {
    let timeMin: Date;
    let timeMax: Date;
    
    switch (view) {
      case 'day':
        timeMin = startOfDay(date);
        timeMax = endOfDay(date);
        break;
      case 'week':
        timeMin = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
        timeMax = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case 'month':
      default:
        timeMin = startOfMonth(date);
        timeMax = endOfMonth(date);
        break;
    }
    
    return { timeMin, timeMax };
  };

  // Toggle calendar selection
  const toggleCalendarSelection = (calendarId: string) => {
    setCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId ? { ...cal, selected: !cal.selected } : cal
      )
    );
  };

  // Add a new event
  const addEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare event for Google Calendar API
      const gcalEvent = {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        attendees: event.attendees,
        colorId: event.colorId
      };
      
      // Use primary calendar if none specified
      const calendarId = event.calendarId || calendars.find(c => c.primary)?.id || 'primary';
      
      const createdEvent = await createEvent(calendarId, gcalEvent);
      
      // Format the created event
      const newEvent: CalendarEvent = {
        id: createdEvent.id,
        calendarId,
        summary: createdEvent.summary || 'Untitled Event',
        description: createdEvent.description,
        start: createdEvent.start,
        end: createdEvent.end,
        location: createdEvent.location,
        attendees: createdEvent.attendees,
        colorId: createdEvent.colorId
      };
      
      // Add to events list
      setEvents(prev => [...prev, newEvent]);
      
      return newEvent;
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Edit an existing event
  const editEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare event for Google Calendar API
      const gcalEvent = {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        attendees: event.attendees,
        colorId: event.colorId
      };
      
      const updatedEvent = await updateEvent(event.calendarId, event.id, gcalEvent);
      
      // Format the updated event
      const editedEvent: CalendarEvent = {
        id: updatedEvent.id,
        calendarId: event.calendarId,
        summary: updatedEvent.summary || 'Untitled Event',
        description: updatedEvent.description,
        start: updatedEvent.start,
        end: updatedEvent.end,
        location: updatedEvent.location,
        attendees: updatedEvent.attendees,
        colorId: updatedEvent.colorId
      };
      
      // Update events list
      setEvents(prev =>
        prev.map(e =>
          e.id === event.id && e.calendarId === event.calendarId ? editedEvent : e
        )
      );
      
      return editedEvent;
    } catch (err) {
      console.error('Error editing event:', err);
      setError('Failed to update event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove an event
  const removeEvent = async (calendarId: string, eventId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteEvent(calendarId, eventId);
      
      // Remove from events list
      setEvents(prev =>
        prev.filter(e => !(e.id === eventId && e.calendarId === calendarId))
      );
      
      return true;
    } catch (err) {
      console.error('Error removing event:', err);
      setError('Failed to delete event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();
    
    return events.filter(event => {
      const eventStart = new Date(event.start.dateTime).getTime();
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  // Get events for a specific period
  const getEventsForPeriod = (startDate: Date, endDate: Date): CalendarEvent[] => {
    const periodStart = startDate.getTime();
    const periodEnd = endDate.getTime();
    
    return events.filter(event => {
      const eventStart = new Date(event.start.dateTime).getTime();
      return eventStart >= periodStart && eventStart <= periodEnd;
    });
  };

  const value = {
    calendars,
    events,
    selectedDate,
    viewType,
    isLoading,
    error,
    setSelectedDate,
    setViewType,
    toggleCalendarSelection,
    refreshEvents,
    addEvent,
    editEvent,
    removeEvent,
    getEventsForDay,
    getEventsForPeriod
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}