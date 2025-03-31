import React from 'react';
import { format, startOfDay, addDays, isToday, isWeekend } from 'date-fns';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../../contexts/CalendarContext';

const CalendarEmbed: React.FC = () => {
  const { selectedDate, getEventsForDay } = useCalendar();
  
  // Get events for the next 3 days
  const getDaysEvents = () => {
    const days = [];
    
    for (let i = 0; i < 3; i++) {
      const date = addDays(startOfDay(selectedDate), i);
      const dayEvents = getEventsForDay(date);
      
      days.push({
        date,
        events: dayEvents,
      });
    }
    
    return days;
  };
  
  const daysWithEvents = getDaysEvents();
  
  return (
    <div className="calendar-embed mt-2 rounded-lg border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-800 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
          Upcoming Events
        </h3>
      </div>
      
      <div className="divide-y divide-neutral-200">
        {daysWithEvents.map((day) => (
          <div key={day.date.toISOString()} className="px-4 py-2">
            <h4 className={`text-sm font-medium mb-1 ${
              isToday(day.date) 
                ? 'text-primary' 
                : isWeekend(day.date) 
                ? 'text-accent-red' 
                : 'text-neutral-700'
            }`}>
              {isToday(day.date)
                ? 'Today'
                : format(day.date, 'EEEE, MMMM d')}
            </h4>
            
            {day.events.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No events scheduled</p>
            ) : (
              <ul className="space-y-2">
                {day.events.map((event) => (
                  <li key={event.id} className="text-xs">
                    <div className="flex">
                      <div className="w-1 rounded-full self-stretch mr-2" 
                           style={{ backgroundColor: event.colorId ? `var(--color-${event.colorId})` : '#4285F4' }}></div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-800">{event.summary}</p>
                        
                        <div className="mt-1 flex items-center text-neutral-500">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>
                            {format(new Date(event.start.dateTime), 'h:mm a')} - 
                            {format(new Date(event.end.dateTime), 'h:mm a')}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="mt-1 flex items-center text-neutral-500">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="mt-1 flex items-center text-neutral-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            <span>
                              {event.attendees
                                .slice(0, 2)
                                .map((a) => a.displayName || a.email)
                                .join(', ')}
                              {event.attendees.length > 2 && 
                                ` +${event.attendees.length - 2} more`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-200 flex justify-between">
        <button className="text-xs text-primary hover:text-primary/80 font-medium">
          View Full Calendar
        </button>
        <button className="text-xs text-primary hover:text-primary/80 font-medium">
          Add Event
        </button>
      </div>
    </div>
  );
};

export default CalendarEmbed;