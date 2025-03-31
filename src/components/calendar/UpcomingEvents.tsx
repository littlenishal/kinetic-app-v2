import React, { useState } from 'react';
import { format, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import TodosList from '../todo/TodosList';
import ChoresList from '../chore/ChoresList';

const UpcomingEvents: React.FC = () => {
  const { getEventsForDay } = useCalendar();
  useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'todos' | 'chores'>('events');
  const [visibleDays, setVisibleDays] = useState(3);
  
  // Get the upcoming events for the visible days
  const upcomingEvents = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < visibleDays; i++) {
      const date = addDays(startOfDay(today), i);
      const dayEvents = getEventsForDay(date);
      
      days.push({
        date,
        events: dayEvents.sort((a, b) => {
          return new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime();
        })
      });
    }
    
    return days;
  };
  
  // Format the day heading
  const formatDayHeading = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMM d');
    }
  };
  
  // Get member color by ID
  const getMemberColor = (event: any) => {
    // First try to use the event's color if available
    if (event.colorId) {
      return `var(--color-${event.colorId})`;
    }
    
    // Otherwise use a default color
    return '#4285F4';
  };
  
  // Load more days
  const handleLoadMore = () => {
    setVisibleDays(prev => prev + 3);
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">Upcoming</h2>
          <button className="text-primary hover:text-primary/80">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'events'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'todos'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            To-Dos
          </button>
          <button
            onClick={() => setActiveTab('chores')}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'chores'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Chores
          </button>
        </div>
      </div>
      
      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'events' && (
          <div className="divide-y divide-neutral-100">
            {upcomingEvents().map((day) => (
              <div key={day.date.toISOString()} className="p-4">
                <h3 className="text-sm font-medium text-neutral-800 mb-2">
                  {formatDayHeading(day.date)}
                </h3>
                
                {day.events.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic">No events scheduled</p>
                ) : (
                  <ul className="space-y-3">
                    {day.events.map((event) => (
                      <li key={event.id} className="flex items-start">
                        <div 
                          className="w-1 self-stretch rounded-full mr-3 mt-1"
                          style={{ backgroundColor: getMemberColor(event) }}
                        ></div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800">
                            {event.summary}
                          </p>
                          
                          <p className="text-xs text-neutral-600 mt-0.5">
                            {format(new Date(event.start.dateTime), 'h:mm a')} - 
                            {format(new Date(event.end.dateTime), 'h:mm a')}
                          </p>
                          
                          {event.location && (
                            <p className="text-xs text-neutral-500 mt-0.5 truncate">
                              {event.location}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            
            {/* Load more button */}
            <div className="p-4">
              <button 
                onClick={handleLoadMore}
                className="w-full flex items-center justify-center px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Load More
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'todos' && <TodosList />}
        
        {activeTab === 'chores' && <ChoresList />}
      </div>
    </div>
  );
};

export default UpcomingEvents;