import React, { useState } from 'react';
import { format, addHours } from 'date-fns';
import { useCalendar } from '../../contexts/CalendarContext';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EventFormProps {
  date: Date;
  event?: any; // Optional event data for editing
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ date, event, onClose }) => {
  const { calendars, addEvent, editEvent } = useCalendar();
  const { familyMembers } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Default event duration is 1 hour
  const startTime = date;
  const endTime = addHours(date, 1);
  
  // Form state
  const [title, setTitle] = useState(event?.summary || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(format(startTime, "yyyy-MM-dd"));
  const [startTimeStr, setStartTimeStr] = useState(format(startTime, "HH:mm"));
  const [endDate, setEndDate] = useState(format(endTime, "yyyy-MM-dd"));
  const [endTimeStr, setEndTimeStr] = useState(format(endTime, "HH:mm"));
  const [location, setLocation] = useState(event?.location || '');
  const [calendarId, setCalendarId] = useState(event?.calendarId || calendars.find(c => c.primary)?.id || calendars[0]?.id);
  const [attendees, setAttendees] = useState<string[]>(
    event?.attendees?.map((a: any) => a.email) || []
  );
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    const start = new Date(`${startDate}T${startTimeStr}`);
    const end = new Date(`${endDate}T${endTimeStr}`);
    
    if (isNaN(start.getTime())) {
      newErrors.start = 'Invalid start date/time';
    }
    
    if (isNaN(end.getTime())) {
      newErrors.end = 'Invalid end date/time';
    }
    
    if (start >= end) {
      newErrors.time = 'End time must be after start time';
    }
    
    if (!calendarId) {
      newErrors.calendar = 'Please select a calendar';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Toggle family member as attendee
  const toggleAttendee = (email: string) => {
    setAttendees(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const start = new Date(`${startDate}T${startTimeStr}`);
      const end = new Date(`${endDate}T${endTimeStr}`);
      
      const eventData = {
        calendarId,
        summary: title,
        description,
        start: {
          dateTime: start.toISOString(),
        },
        end: {
          dateTime: end.toISOString(),
        },
        location,
        attendees: attendees.length > 0 ? attendees.map(email => ({ email })) : undefined
      };
      
      if (event) {
        await editEvent({
          ...eventData,
          id: event.id
        });
      } else {
        await addEvent(eventData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      setErrors({ submit: 'Failed to save event' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-neutral-800">
            {event ? 'Edit Event' : 'Add New Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Title field */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border ${
                errors.title ? 'border-accent-red' : 'border-neutral-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-accent-red">{errors.title}</p>
            )}
          </div>
          
          {/* Start date/time fields */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Start Date & Time*
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.start ? 'border-accent-red' : 'border-neutral-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
              </div>
              <div className="flex-1">
                <input
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.start ? 'border-accent-red' : 'border-neutral-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
              </div>
            </div>
            {errors.start && (
              <p className="mt-1 text-xs text-accent-red">{errors.start}</p>
            )}
          </div>
          
          {/* End date/time fields */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              End Date & Time*
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.end ? 'border-accent-red' : 'border-neutral-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
              </div>
              <div className="flex-1">
                <input
                  type="time"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.end ? 'border-accent-red' : 'border-neutral-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                />
              </div>
            </div>
            {errors.end && (
              <p className="mt-1 text-xs text-accent-red">{errors.end}</p>
            )}
            {errors.time && (
              <p className="mt-1 text-xs text-accent-red">{errors.time}</p>
            )}
          </div>
          
          {/* Location field */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter location (optional)"
            />
          </div>
          
          {/* Description field */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Add details here (optional)"
            />
          </div>
          
          {/* Calendar selection */}
          <div className="mb-4">
            <label htmlFor="calendar" className="block text-sm font-medium text-neutral-700 mb-1">
              Calendar*
            </label>
            <select
              id="calendar"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className={`w-full px-3 py-2 border ${
                errors.calendar ? 'border-accent-red' : 'border-neutral-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
            {errors.calendar && (
              <p className="mt-1 text-xs text-accent-red">{errors.calendar}</p>
            )}
          </div>
          
          {/* Attendees */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Family Members
            </label>
            <div className="max-h-32 overflow-y-auto border border-neutral-300 rounded-md p-2">
              {familyMembers.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">No family members</p>
              ) : (
                <div className="space-y-2">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`member-${member.profile?.full_name ?? member.id}`}
                        checked={typeof member?.email === 'string' && attendees.includes(member.email)}
                        onChange={() => {
                          if (member?.email) {
                            toggleAttendee(member.email);
                          }
                        }}
                        className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="ml-2 text-sm text-neutral-700"
                      >
                        {member?.profile?.full_name || 'Unknown'}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Form error */}
          {errors.submit && (
            <div className="mb-4 p-2 bg-accent-red/10 text-accent-red rounded-md text-sm">
              {errors.submit}
            </div>
          )}
          
          {/* Form actions */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSubmitting 
                ? 'Saving...' 
                : event
                  ? 'Update Event' 
                  : 'Add Event'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
