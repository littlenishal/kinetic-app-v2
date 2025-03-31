import React, { useState } from 'react';
import { format, isAfter, isBefore, isToday, isTomorrow } from 'date-fns';
import { useTodos, Todo } from '../../contexts/TodosContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PlusIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon, 
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import TodoForm from './TodosForm';

const TodosList: React.FC = () => {
  const { isLoading, toggleTodoStatus, filterTodos } = useTodos();
  const { familyMembers, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending' | 'completed'>('pending');
  
  // Apply filters
  const filteredTodos = filterTodos({
    status: filter === 'all' ? undefined : filter === 'pending' ? 'pending' : filter === 'completed' ? 'completed' : undefined,
    assignedTo: filter === 'mine' ? user?.id || null : undefined
  });
  
  // Sort todos: first by completion status, then by due date, then by priority
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // First by status (incomplete first)
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    
    // Then by due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    
    // No due date goes last
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    
    // Finally by priority
    const priorityValue = { high: 0, medium: 1, low: 2 };
    return priorityValue[a.priority] - priorityValue[b.priority];
  });
  
  // Group todos by due date
  type GroupedTodos = {
    label: string;
    todos: Todo[];
  };
  
  const groupTodosByDueDate = (): GroupedTodos[] => {
    const groups: Record<string, GroupedTodos> = {
      overdue: { label: 'Overdue', todos: [] },
      today: { label: 'Today', todos: [] },
      tomorrow: { label: 'Tomorrow', todos: [] },
      thisWeek: { label: 'This Week', todos: [] },
      later: { label: 'Later', todos: [] },
      noDueDate: { label: 'No Due Date', todos: [] }
    };
    
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    sortedTodos.forEach(todo => {
      if (!todo.due_date) {
        groups.noDueDate.todos.push(todo);
        return;
      }
      
      const dueDate = new Date(todo.due_date);
      
      if (isBefore(dueDate, now) && !isToday(dueDate) && todo.status !== 'completed') {
        groups.overdue.todos.push(todo);
      } else if (isToday(dueDate)) {
        groups.today.todos.push(todo);
      } else if (isTomorrow(dueDate)) {
        groups.tomorrow.todos.push(todo);
      } else if (isBefore(dueDate, weekFromNow)) {
        groups.thisWeek.todos.push(todo);
      } else {
        groups.later.todos.push(todo);
      }
    });
    
    // Only return groups that have todos
    return Object.values(groups).filter(group => group.todos.length > 0);
  };
  
  const groupedTodos = groupTodosByDueDate();
  
  // Format date for display
  const formatDueDate = (dateString: string | null): string => {
    if (!dateString) return 'No due date';
    
    const dueDate = new Date(dateString);
    const now = new Date();
    
    if (isToday(dueDate)) {
      return 'Today';
    } else if (isTomorrow(dueDate)) {
      return 'Tomorrow';
    } else if (isBefore(dueDate, now) && !isToday(dueDate)) {
      return `Overdue: ${format(dueDate, 'MMM d')}`;
    } else {
      return format(dueDate, 'MMM d');
    }
  };
  
  // Priority color mapping
  const priorityColors = {
    high: 'text-accent-red',
    medium: 'text-accent-yellow',
    low: 'text-neutral-500'
  };
  
  // Toggle todo completion status
  const handleToggleTodo = async (todoId: string) => {
    try {
      await toggleTodoStatus(todoId);
    } catch (error) {
      console.error('Error toggling todo status:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Filters and add button */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-neutral-700">To-Do List</h3>
          <button 
            onClick={() => setShowForm(true)}
            className="text-primary hover:text-primary/80"
            aria-label="Add to-do"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filter tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 text-xs rounded-full ${
              filter === 'pending' 
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1 text-xs rounded-full ${
              filter === 'mine' 
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            My To-Dos
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
      
      {/* Main todo list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <p className="text-neutral-500">Loading to-dos...</p>
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-neutral-500">No to-dos found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-sm text-primary hover:text-primary/80"
            >
              Add a to-do
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {groupedTodos.map(group => (
              <div key={group.label} className="py-2">
                <h4 className="px-4 py-1 text-xs font-medium text-neutral-500 uppercase">
                  {group.label}
                </h4>
                <ul>
                  {group.todos.map(todo => (
                    <li key={todo.id} className="px-4 py-2 hover:bg-neutral-50">
                      <div className="flex items-start">
                        {/* Checkbox */}
                        <button 
                          onClick={() => handleToggleTodo(todo.id)}
                          className="mt-0.5"
                        >
                          {todo.status === 'completed' ? (
                            <CheckCircleSolidIcon className="h-5 w-5 text-secondary" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                          )}
                        </button>
                        
                        {/* Todo content */}
                        <div className="ml-3 flex-1">
                          <p className={`text-sm ${
                            todo.status === 'completed' 
                              ? 'text-neutral-500 line-through' 
                              : 'text-neutral-800'
                          }`}>
                            {todo.title}
                          </p>
                          
                          {/* Todo metadata */}
                          <div className="mt-1 flex items-center text-xs space-x-2">
                            {/* Priority */}
                            <span className={`flex items-center ${priorityColors[todo.priority]}`}>
                              {todo.priority === 'high' && <ExclamationCircleIcon className="h-3 w-3 mr-1" />}
                              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                            </span>
                            
                            {/* Due date */}
                            {todo.due_date && (
                              <span className={`flex items-center ${
                                isAfter(new Date(todo.due_date), new Date()) || isToday(new Date(todo.due_date))
                                  ? 'text-neutral-500'
                                  : 'text-accent-red'
                              }`}>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatDueDate(todo.due_date)}
                              </span>
                            )}
                            
                            {/* Assignee */}
                            {todo.assignee_name && (
                              <span className="text-neutral-500">
                                {todo.assignee_name}
                              </span>
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
      
      {/* Add Todo Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-800">Add New To-Do</h3>
            </div>
            
            <TodoForm 
              onClose={() => setShowForm(false)}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TodosList;