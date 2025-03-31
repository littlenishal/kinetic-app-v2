import React, { useState } from 'react';
import { useChores } from '../../contexts/ChoresContext';

interface ChoreFormProps {
  onClose: () => void;
  familyMembers: any[];
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    assigned_to?: string | null;
    rotation?: boolean;
    rotation_members?: string[] | null;
  };
  isEditing?: boolean;
}

const ChoreForm: React.FC<ChoreFormProps> = ({ 
  onClose, 
  familyMembers,
  initialData,
  isEditing = false
}) => {
  const { createChore, updateChore } = useChores();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(initialData?.frequency || 'weekly');
  const [rotation, setRotation] = useState(initialData?.rotation || false);
  const [assignedTo, setAssignedTo] = useState<string | null>(initialData?.assigned_to || null);
  const [rotationMembers, setRotationMembers] = useState<string[]>(initialData?.rotation_members || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (rotation && (!rotationMembers || rotationMembers.length < 2)) {
      newErrors.rotation = 'Rotation requires at least 2 family members';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Toggle rotation member selection
  const toggleRotationMember = (userId: string) => {
    setRotationMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
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
      
      const choreData = {
        title,
        description: description || null,
        frequency,
        rotation,
        assigned_to: rotation ? null : assignedTo, // If rotation is enabled, assign through rotation system
        rotation_members: rotation ? rotationMembers : null,
        current_assignee_index: rotation ? 0 : null // Start with the first member in rotation
      };
      
      if (isEditing && initialData?.id) {
        await updateChore(initialData.id, choreData);
      } else {
        await createChore(choreData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving chore:', error);
      setErrors({ submit: 'Failed to save chore' });
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
          placeholder="Enter chore title"
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
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="Add details here (optional)"
        />
      </div>
      
      {/* Frequency field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Frequency
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setFrequency('daily')}
            className={`flex-1 py-2 text-sm rounded-md ${
              frequency === 'daily'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setFrequency('weekly')}
            className={`flex-1 py-2 text-sm rounded-md ${
              frequency === 'weekly'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setFrequency('monthly')}
            className={`flex-1 py-2 text-sm rounded-md ${
              frequency === 'monthly'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      
      {/* Rotation toggle */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <label htmlFor="rotation" className="text-sm font-medium text-neutral-700">
            Use Rotation System
          </label>
          <button
            type="button"
            onClick={() => setRotation(!rotation)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              rotation ? 'bg-primary' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`${
                rotation ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          When enabled, the chore will automatically rotate between selected family members
        </p>
      </div>
      
      {/* Assignment section */}
      {rotation ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Rotation Members
          </label>
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div key={member.user_id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`member-${member.user_id}`}
                  checked={rotationMembers.includes(member.user_id)}
                  onChange={() => toggleRotationMember(member.user_id)}
                  className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                />
                <label
                  htmlFor={`member-${member.user_id}`}
                  className="ml-2 text-sm text-neutral-700"
                >
                  {member.profile?.full_name || 'Unknown'}
                </label>
              </div>
            ))}
            
            {errors.rotation && (
              <p className="mt-1 text-xs text-accent-red">{errors.rotation}</p>
            )}
          </div>
        </div>
      ) : (
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
      )}
      
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
              ? 'Update Chore' 
              : 'Add Chore'
          }
        </button>
      </div>
    </form>
  );
};

export default ChoreForm;