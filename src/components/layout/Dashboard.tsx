import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ConversationalInterface from '../chat/ConversationalInterface';
import UpcomingEvents from '../calendar/UpcomingEvents';
import { CalendarProvider } from '../../contexts/CalendarContext';
import { ChatProvider } from '../../contexts/ChatContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user, currentFamily } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close panels on mobile
      if (mobile) {
        setIsSidebarOpen(false);
        setIsRightPanelOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsRightPanelOpen(true);
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // If no user or family selected, show message
  if (!user || !currentFamily) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold text-neutral-700 mb-2">
            Welcome to Family Calendar Assistant
          </h2>
          <p className="text-neutral-500 mb-6">
            {!user 
              ? 'Please sign in to access your family calendar.' 
              : 'Please create or select a family to continue.'}
          </p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            {!user ? 'Sign In' : 'Select Family'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <CalendarProvider>
      <ChatProvider>
        <div className="h-screen flex flex-col bg-white">
          {/* Header */}
          <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          />
          
          {/* Main content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar - conditionally shown based on state */}
            {isSidebarOpen && (
              <div 
                className={`${
                  isMobile 
                    ? 'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform' 
                    : 'w-1/4 border-r border-neutral-200'
                }`}
              >
                {isMobile && (
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                <Sidebar />
              </div>
            )}
            
            {/* Center panel - chat interface */}
            <div className={`${
              isMobile || (!isSidebarOpen && !isRightPanelOpen)
                ? 'w-full'
                : !isSidebarOpen && isRightPanelOpen
                  ? 'w-3/4'
                  : isSidebarOpen && !isRightPanelOpen
                    ? 'w-3/4'
                    : 'w-2/4'
              } h-full overflow-hidden`}
            >
              <ConversationalInterface />
            </div>
            
            {/* Right panel - upcoming events */}
            {isRightPanelOpen && (
              <div 
                className={`${
                  isMobile 
                    ? 'fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transition-transform' 
                    : 'w-1/4 border-l border-neutral-200'
                }`}
              >
                {isMobile && (
                  <button
                    onClick={() => setIsRightPanelOpen(false)}
                    className="absolute top-4 left-4 text-neutral-500 hover:text-neutral-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                <UpcomingEvents />
              </div>
            )}
          </div>
        </div>
      </ChatProvider>
    </CalendarProvider>
  );
};

export default Dashboard;