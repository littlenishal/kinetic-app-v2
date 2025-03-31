import React, { useState } from 'react';
import { format, isToday, isPast, isThisWeek } from 'date-fns';
import { useChores, Chore } from '../../contexts/ChoresContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PlusIcon, 
  CheckIcon,
  ArrowPathIcon, 
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ChoreForm from './ChoresForm';

const ChoresList: React.FC = () => {
  const { chores, isLoading, completeChore, getDueChores } = useChores();
  const { familyMembers, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'due' | 'completed'>('due');
  
  // Apply filters
  const filteredChores = (): Chore[] => {
    switch (filter) {
      case 'mine':
        return chores.filter(chore => chore.assigned_to === user?.id);
      case 'due':
        return getDueChores();
      case 'completed':
        // Show chores completed in the last week
        return chores.filter(chore => {
          if (!chore.last_completed) return false;
          const completedDate = new Date(chore.last_completed);
          return isThisWeek(completedDate);
        });
      case 'all':
      default:
        return chores;
    }
  };
  
  // Sort chores: first by due date (overdue first), then by title
  const sortedChores = [...filteredChores()].sort((a, b) => {
    // Due chores come first
    if (a.next_due && !b.next_due) return -1;
    if (!a.next_due && b.next_due) return 1;
    
    if (a.next_due && b.next_due) {
      const aDue = new Date(a.next_due);
      const bDue = new Date(b.next_due);
      
      // Overdue chores first
      const aOverdue = isPast(aDue) && !isToday(aDue);
      const bOverdue = isPast(bDue) && !isToday(bDue);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then sort by due date
      return aDue.getTime() - bDue.getTime();
    }
    
    // Fallback to title sort
    return a.title.localeCompare(b.title);
  });
  
  // Group chores by status
  type GroupedChores = {
    label: string;
    chores: Chore[];
  };
  
  const groupChoresByStatus = (): GroupedChores[] => {
    const groups: Record<string, GroupedChores> = {
      overdue: { label: 'Overdue', chores: [] },
      dueToday: { label: 'Due Today', chores: [] },
      upcoming: { label: 'Upcoming', chores: [] },
      completed: { label: 'Recently Completed', chores: [] }
    };
    
    
    sortedChores.forEach(chore => {
      if (chore.last_completed && isThisWeek(new Date(chore.last_completed))) {
        groups.completed.chores.push(chore);
        return;
      }
      
      if (!chore.next_due) {
        groups.upcoming.chores.push(chore);
        return;
      }
      
      const dueDate = new Date(chore.next_due);
      
      if (isPast(dueDate) && !isToday(dueDate)) {
        groups.overdue.chores.push(chore);
      } else if (isToday(dueDate)) {
        groups.dueToday.chores.push(chore);
      } else {
        groups.upcoming.chores.push(chore);
      }
    });
    
    // Only return groups that have chores
    return Object.values(groups).filter(group => group.chores.length > 0);
  };
  
  const groupedChores = groupChoresByStatus();
  
  // Format date for display
  const formatDueDate = (dateString: string | null): string => {
    if (!dateString) return 'No due date';
    
    const dueDate = new Date(dateString);
    
    if (isToday(dueDate)) {
      return 'Today';
    } else if (isPast(dueDate) && !isToday(dueDate)) {
      return `Overdue: ${format(dueDate, 'MMM d')}`;
    } else {
      return format(dueDate, 'MMM d');
    }
  };
  
  // Format frequency for display
  const formatFrequency = (frequency: 'daily' | 'weekly' | 'monthly'): string => {
    switch (frequency) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'monthly':
        return 'Every month';
      default:
        return frequency;
    }
  };
  
  // Handle marking chore as complete
  const handleCompleteChore = async (choreId: string) => {
    try {
      await completeChore(choreId);
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Filters and add button */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-neutral-700">Chores</h3>
          <button 
            onClick={() => setShowForm(true)}
            className="text-primary hover:text-primary/80"
            aria-label="Add chore"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filter tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('due')}
            className={`px-3 py-1 text-xs rounded-full ${
              filter === 'due' 
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Due
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1 text-xs rounded-full ${
              filter === 'mine' 
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            My Chores
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-xs rounded-full ${
              filter === 'completed' 
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full ${
              filter === 'all' 
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
        </div>
      </div>
      
      {/* Main chores list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <p className="text-neutral-500">Loading chores...</p>
          </div>
        ) : sortedChores.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-neutral-500">No chores found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-sm text-primary hover:text-primary/80"
            >
              Add a chore
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {groupedChores.map(group => (
              <div key={group.label} className="py-2">
                <h4 className="px-4 py-1 text-xs font-medium text-neutral-500 uppercase">
                  {group.label}
                </h4>
                <ul>
                  {group.chores.map(chore => (
                    <li key={chore.id} className="px-4 py-2 hover:bg-neutral-50">
                      <div className="flex items-start">
                        {/* Chore status indicator */}
                        <div className="mt-1">
                          {group.label === 'Recently Completed' ? (
                            <CheckCircleIcon className="h-5 w-5 text-secondary" />
                          ) : chore.rotation ? (
                            <ArrowPathIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <div 
                              className={`h-5 w-5 rounded-full border-2 ${
                                group.label === 'Overdue'
                                  ? 'border-accent-red'
                                  : group.label === 'Due Today'
                                  ? 'border-accent-yellow'
                                  : 'border-neutral-400'
                              }`}
                            />
                          )}
                        </div>
                        
                        {/* Chore content */}
                        <div className="ml-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-800">
                                {chore.title}
                              </p>
                              
                              {/* Frequency and assignee */}
                              <div className="mt-1 flex items-center text-xs text-neutral-500 space-x-2">
                                <span>
                                  {formatFrequency(chore.frequency)}
                                </span>
                                
                                {chore.assignee_name && (
                                  <span>
                                    • {chore.assignee_name}
                                  </span>
                                )}
                                
                                {/* Due date */}
                                {chore.next_due && (
                                  <span className={`flex items-center ${
                                    group.label === 'Overdue'
                                      ? 'text-accent-red'
                                      : group.label === 'Due Today'
                                      ? 'text-accent-yellow'
                                      : 'text-neutral-500'
                                  }`}>
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    {formatDueDate(chore.next_due)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            {group.label !== 'Recently Completed' && (
                              <button
                                onClick={() => handleCompleteChore(chore.id)}
                                className="ml-2 p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                                aria-label="Mark as complete"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Chore Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-800">Add New Chore</h3>
            </div>
            
            <ChoreForm 
              onClose={() => setShowForm(false)}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChoresList;