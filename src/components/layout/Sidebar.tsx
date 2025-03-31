import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CalendarDaysIcon, 
  ChatBubbleLeftRightIcon, 
  ClipboardDocumentCheckIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const { currentFamily, familyMembers } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  
  // Navigation items
  const navItems = [
    {
      id: 'chat',
      name: 'Chat',
      icon: ChatBubbleLeftRightIcon
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: CalendarDaysIcon
    },
    {
      id: 'todos',
      name: 'To-Dos',
      icon: ClipboardDocumentListIcon
    },
    {
      id: 'chores',
      name: 'Chores',
      icon: ClipboardDocumentCheckIcon
    }
  ];
  
  // Color mapping for family member roles
  const roleColors = {
    parent: '#4285F4', // Primary blue
    child: '#34A853',  // Secondary green
    other: '#FBBC05'   // Accent yellow
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Family name */}
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800">{currentFamily?.name}</h2>
        <p className="text-sm text-neutral-500">{familyMembers.length} members</p>
      </div>
      
      {/* Family members */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-neutral-700">Family Members</h3>
          <button 
            className="text-primary hover:text-primary/80"
            aria-label="Add family member"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        
        <ul className="space-y-2">
          {familyMembers.map((member) => (
            <li key={member.id} className="flex items-center">
              <div 
                className="h-7 w-7 rounded-full flex items-center justify-center mr-2 text-white"
                style={{ backgroundColor: roleColors[member.role] }}
              >
                {member.profile?.avatar_url ? (
                  <img 
                    src={member.profile.avatar_url} 
                    alt={member.profile.full_name} 
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <span className="text-xs">
                    {member.profile?.full_name.charAt(0) || '?'}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {member.profile?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {member.role}
                </p>
              </div>
            </li>
          ))}
          
          {familyMembers.length === 0 && (
            <li className="text-sm text-neutral-500 italic">
              No family members yet
            </li>
          )}
        </ul>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Family settings button */}
      <div className="p-4 border-t border-neutral-200">
        <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          Family Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;