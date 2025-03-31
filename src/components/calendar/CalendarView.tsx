import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import EventForm from './EventForm';

const CalendarView: React.FC = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    viewType, 
    setViewType, 
    events, 
    getEventsForDay 
  } = useCalendar();
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);
  
  // Navigation handlers
  const handlePrevious = () => {
    if (viewType === 'month') {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (viewType === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subDays(selectedDate, 1));
    }
  };
  
  const handleNext = () => {
    if (viewType === 'month') {
      setSelectedDate(addMonths(selectedDate, 1));
    } else if (viewType === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };
  
  const handleToday = () => {
    setSelectedDate(new Date());
  };
  
  // Date selection handler
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    
    if (viewType === 'month') {
      setViewType('day');
    }
  };
  
  // Add event handler
  const handleAddEvent = (date: Date) => {
    setSelectedEventDate(date);
    setShowEventForm(true);
  };
  
  // Format the calendar header based on view type
  const formatCalendarHeader = () => {
    if (viewType === 'month') {
      return format(selectedDate, 'MMMM yyyy');
    } else if (viewType === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const startMonth = format(start, 'MMM');
      const endMonth = format(end, 'MMM');
      
      if (startMonth === endMonth) {
        return `${startMonth} ${format(start, 'd')} - ${format(end, 'd')}, ${format(selectedDate, 'yyyy')}`;
      } else {
        return `${startMonth} ${format(start, 'd')} - ${endMonth} ${format(end, 'd')}, ${format(selectedDate, 'yyyy')}`;
      }
    } else {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    }
  };
  
  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const dateFormat = 'd';
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group days by weeks
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    days.forEach((day, i) => {
      if (i % 7 === 0 && i > 0) {
        weeks.push(week);
        week = [];
      }
      week.push(day);
      if (i === days.length - 1) {
        weeks.push(week);
      }
    });
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200 border-b border-neutral-300">
          {weekdays.map((day) => (
            <div 
              key={day} 
              className="p-2 text-center text-sm font-medium text-neutral-700"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200">
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, selectedDate);
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <div 
                    key={day.toString()}
                    onClick={() => handleSelectDate(day)}
                    className={`min-h-24 p-1 bg-white ${isCurrentMonth ? '' : 'bg-neutral-50 text-neutral-400'}`}
                  >
                    <div className="flex justify-between">
                      <button
                        className={`h-6 w-6 flex items-center justify-center text-sm font-medium ${
                          isToday(day) 
                            ? 'bg-primary text-white rounded-full' 
                            : isSelected
                            ? 'bg-primary/20 text-primary rounded-full'
                            : isWeekend(day) && isCurrentMonth
                            ? 'text-accent-red'
                            : isCurrentMonth
                            ? 'text-neutral-900'
                            : 'text-neutral-400'
                        }`}
                      >
                        {format(day, dateFormat)}
                      </button>
                      
                      {isCurrentMonth && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddEvent(day);
                          }}
                          className="h-5 w-5 text-neutral-400 hover:text-primary"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Event indicators */}
                    <div className="mt-1 max-h-20 overflow-y-auto space-y-1">
                      {dayEvents.length > 0 ? (
                        dayEvents.slice(0, 3).map((event) => (
                          <div 
                            key={event.id}
                            className="px-1 py-0.5 text-xs rounded truncate"
                            style={{ 
                              backgroundColor: event.colorId ? `var(--color-${event.colorId})` : '#4285F4',
                              color: 'white'
                            }}
                          >
                            {format(new Date(event.start.dateTime), 'HH:mm')} {event.summary}
                          </div>
                        ))
                      ) : null}
                      
                      {dayEvents.length > 3 && (
                        <div className="px-1 text-xs text-neutral-500">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Generate time slots for the day
    const timeSlots = [];
    for (let i = 6; i < 23; i++) {
      timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-px bg-neutral-200 border-b border-neutral-300">
          <div className="p-2 text-center text-sm font-medium text-neutral-700">
            Time
          </div>
          {days.map((day) => (
            <div 
              key={day.toString()} 
              className={`p-2 text-center ${
                isToday(day) 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : isWeekend(day)
                  ? 'text-accent-red'
                  : 'text-neutral-700'
              }`}
            >
              <div>{format(day, 'EEE')}</div>
              <div className="font-medium">{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="overflow-y-auto max-h-[600px]">
          <div className="relative grid grid-cols-8 gap-px bg-neutral-200">
            {/* Time slots */}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="p-1 bg-white text-xs text-neutral-500 text-right pr-2">
                  {time}
                </div>
                {days.map((day) => {
                  const [hour] = time.split(':').map(Number);
                  const slotStart = new Date(day);
                  slotStart.setHours(hour, 0, 0, 0);
                  const slotEnd = new Date(day);
                  slotEnd.setHours(hour + 1, 0, 0, 0);
                  
                  // Find events for this time slot
                  const slotEvents = events.filter((event) => {
                    const eventStart = new Date(event.start.dateTime);
                    const eventEnd = new Date(event.end.dateTime);
                    
                    // Event starts during this slot or is ongoing during this slot
                    return (
                      (eventStart >= slotStart && eventStart < slotEnd) ||
                      (eventStart < slotStart && eventEnd > slotStart)
                    ) && isSameDay(day, eventStart);
                  });
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className="p-1 bg-white min-h-14 relative"
                      onClick={() => {
                        const clickTime = new Date(day);
                        clickTime.setHours(hour);
                        handleAddEvent(clickTime);
                      }}
                    >
                      {slotEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="absolute left-1 right-1 px-1 py-0.5 text-xs rounded truncate text-white z-10"
                          style={{ 
                            backgroundColor: event.colorId ? `var(--color-${event.colorId})` : '#4285F4',
                            top: '1px',
                          }}
                        >
                          {format(new Date(event.start.dateTime), 'HH:mm')} {event.summary}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render day view
  const renderDayView = () => {
    // Generate time slots for the day
    const timeSlots = [];
    for (let i = 6; i < 23; i++) {
      timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    
    // Get events for this day (removed unused variable)
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Day header */}
        <div className="p-4 border-b border-neutral-300 bg-neutral-50">
          <h3 className={`text-lg font-medium ${
            isToday(selectedDate) 
              ? 'text-primary' 
              : isWeekend(selectedDate)
              ? 'text-accent-red'
              : 'text-neutral-800'
          }`}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
        </div>
        
        {/* Time grid */}
        <div className="overflow-y-auto max-h-[600px]">
          <div className="relative">
            {/* Time slots */}
            {timeSlots.map((time) => {
              const [hour] = time.split(':').map(Number);
              const slotStart = new Date(selectedDate);
              slotStart.setHours(hour, 0, 0, 0);
              const slotEnd = new Date(selectedDate);
              slotEnd.setHours(hour + 1, 0, 0, 0);
              
              // Find events for this time slot
              const slotEvents = events.filter((event) => {
                const eventStart = new Date(event.start.dateTime);
                const eventEnd = new Date(event.end.dateTime);
                
                // Event starts during this slot or is ongoing during this slot
                return (
                  (eventStart >= slotStart && eventStart < slotEnd) ||
                  (eventStart < slotStart && eventEnd > slotStart)
                ) && isSameDay(selectedDate, eventStart);
              });
              
              return (
                <div 
                  key={time} 
                  className="flex border-b border-neutral-100"
                  onClick={() => {
                    const clickTime = new Date(selectedDate);
                    clickTime.setHours(hour);
                    handleAddEvent(clickTime);
                  }}
                >
                  <div className="w-20 p-2 text-sm text-neutral-500 text-right pr-4 border-r border-neutral-200">
                    {time}
                  </div>
                  <div className="flex-1 min-h-16 p-1 relative">
                    {slotEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="mb-1 p-2 text-sm rounded-md text-white"
                        style={{ 
                          backgroundColor: event.colorId ? `var(--color-${event.colorId})` : '#4285F4',
                        }}
                      >
                        <div className="font-medium">{event.summary}</div>
                        <div className="text-xs">
                          {format(new Date(event.start.dateTime), 'HH:mm')} - {format(new Date(event.end.dateTime), 'HH:mm')}
                        </div>
                        {event.location && (
                          <div className="text-xs mt-1">{event.location}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Calendar header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-neutral-800">{formatCalendarHeader()}</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-1.5 rounded-full hover:bg-neutral-100"
            >
              <ChevronLeftIcon className="h-5 w-5 text-neutral-600" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-md"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-neutral-100"
            >
              <ChevronRightIcon className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewType('day')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewType === 'day' 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewType === 'week' 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewType === 'month' 
                  ? 'bg-primary text-white' 
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar content */}
      <div className="flex-1 p-4 overflow-auto">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>
      
      {/* Event form modal */}
      {showEventForm && selectedEventDate && (
        <EventForm
          date={selectedEventDate}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  );
};

export default CalendarView;