import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const FamilySetup: React.FC = () => {
  const { user, isLoading, families, createNewFamily } = useAuth();
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not logged in
  if (!user && !isLoading) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect if user already has a family and is just refreshing the page
  if (families.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await createNewFamily(familyName);
      // The AuthContext will update and redirect to dashboard
    } catch (err) {
      console.error('Error creating family:', err);
      setError('Failed to create family. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-neutral-50">
        <CalendarDaysIcon className="h-16 w-16 text-primary animate-pulse" />
        <h2 className="mt-6 text-center text-xl font-medium text-neutral-900">
          Loading...
        </h2>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UserGroupIcon className="h-16 w-16 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900">
          Create Your Family
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Set up your family group to get started with Family Calendar Assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleCreateFamily}>
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-neutral-700">
                Family Name
              </label>
              <div className="mt-1">
                <input
                  id="familyName"
                  name="familyName"
                  type="text"
                  autoComplete="off"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="e.g., The Smith Family"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-accent-red/10 text-accent-red rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !familyName.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Family'}
              </button>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-neutral-600">
                Once you create your family, you'll be able to invite other members to join.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FamilySetup;