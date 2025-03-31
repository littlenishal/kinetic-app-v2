import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get hash fragment from URL
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (!accessToken) {
          // Check for error in URL parameters
          const urlParams = new URLSearchParams(location.search);
          const errorParam = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          if (errorParam) {
            throw new Error(errorDescription || 'Authentication error');
          } else {
            throw new Error('No access token found in URL');
          }
        }
        
        // Exchange token with Supabase
        const { error } = await supabase.auth.refreshSession();
        
        if (error) {
          throw error;
        }
        
        // Redirect to dashboard on success
        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };
    
    handleCallback();
  }, [location, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="flex flex-col items-center">
        <CalendarDaysIcon className="h-16 w-16 text-primary animate-pulse" />
        <h2 className="mt-6 text-center text-xl font-medium text-neutral-900">
          {error ? 'Authentication Error' : 'Completing Sign In...'}
        </h2>
        
        {error ? (
          <div className="mt-4">
            <p className="text-accent-red text-sm">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <p className="mt-2 text-center text-sm text-neutral-600">
            Please wait while we complete the authentication process...
          </p>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;