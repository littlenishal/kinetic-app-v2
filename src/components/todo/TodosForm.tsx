import React, { useState } from 'react';
import { useTodos } from '../../contexts/TodosContext';

interface TodoFormProps {
  onClose: () => void;
  familyMembers: any[];
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    assigned_to?: string | null;
  };
  isEditing?: boolean;
}

const TodoForm: React.FC<TodoFormProps> = ({ 
  onClose, 
  familyMembers,
  initialData,
  isEditing = false
}) => {
  const { createTodo, updateTodo } = useTodos();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialData?.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState<string | null>(initialData?.assigned_to || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        newErrors.dueDate = 'Invalid date format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const todoData = {
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        assigned_to: assignedTo,
        status: 'pending' as const
      };
      
      if (isEditing && initialData?.id) {
        await updateTodo(initialData.id, todoData);
      } else {
        await createTodo(todoData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving todo:', error);
      setErrors({ submit: 'Failed to save to-do' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          placeholder="Enter to-do title"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-accent-red">{errors.title}</p>
        )}
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
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="Add details here (optional)"
        />
      </div>
      
      {/* Due date field */}
      <div className="mb-4">
        <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700 mb-1">
          Due Date
        </label>
        <input
          type="datetime-local"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={`w-full px-3 py-2 border ${
            errors.dueDate ? 'border-accent-red' : 'border-neutral-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
        />
        {errors.dueDate && (
          <p className="mt-1 text-xs text-accent-red">{errors.dueDate}</p>
        )}
      </div>
      
      {/* Priority field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Priority
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setPriority('low')}
            className={`flex-1 py-2 text-sm rounded-md ${
              priority === 'low'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            }`}
          >
            Low
          </button>
          <button
            type="button"
            onClick={() => setPriority('medium')}
            className={`flex-1 py-2 text-sm rounded-md ${
              priority === 'medium'
                ? 'bg-accent-yellow/20 text-accent-yellow/90 border border-accent-yellow/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            }`}
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => setPriority('high')}
            className={`flex-1 py-2 text-sm rounded-md ${
              priority === 'high'
                ? 'bg-accent-red/20 text-accent-red/90 border border-accent-red/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            }`}
          >
            High
          </button>
        </div>
      </div>
      
      {/* Assigned to field */}
      <div className="mb-6">
        <label htmlFor="assignedTo" className="block text-sm font-medium text-neutral-700 mb-1">
          Assign To
        </label>
        <select
          id="assignedTo"
          value={assignedTo || ''}
          onChange={(e) => setAssignedTo(e.target.value || null)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        >
          <option value="">Unassigned</option>
          {familyMembers.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.profile?.full_name || 'Unknown'}
            </option>
          ))}
        </select>
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
            : isEditing 
              ? 'Update To-Do' 
              : 'Add To-Do'
          }
        </button>
      </div>
    </form>
  );
};

export default TodoForm;