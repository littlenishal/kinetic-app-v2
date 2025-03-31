import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  CalendarIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ViewColumnsIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleRightPanel }) => {
  const { user, families, currentFamily, setCurrentFamily, logout } = useAuth();
  
  const handleFamilyChange = (familyId: string) => {
    const family = families.find(f => f.id === familyId);
    if (family) {
      setCurrentFamily(family);
    }
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 py-2 px-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center">
        <button 
          onClick={onToggleSidebar}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        
        <div className="ml-3 flex items-center">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="ml-2 font-semibold text-xl text-neutral-800">Family Calendar</h1>
        </div>
      </div>
      
      {/* Center section - family selector */}
      {families.length > 0 && (
        <div className="hidden md:block">
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center gap-x-1 px-3 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100">
              <span className="font-medium">{currentFamily?.name || 'Select Family'}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {families.map(family => (
                  <Menu.Item key={family.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleFamilyChange(family.id)}
                        className={`${
                          active ? 'bg-neutral-100' : ''
                        } ${
                          currentFamily?.id === family.id ? 'font-medium text-primary' : 'text-neutral-700'
                        } block px-4 py-2 text-sm w-full text-left`}
                      >
                        {family.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
                
                <div className="border-t border-neutral-200 mt-1 pt-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {/* Show create family modal */}}
                        className={`${
                          active ? 'bg-neutral-100' : ''
                        } text-neutral-700 block px-4 py-2 text-sm w-full text-left`}
                      >
                        + Create New Family
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      )}
      
      {/* Right section */}
      <div className="flex items-center space-x-2">
        <button 
          onClick={onToggleRightPanel}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
          aria-label="Toggle right panel"
        >
          <ViewColumnsIcon className="h-5 w-5" />
        </button>
        
        <Menu as="div" className="relative">
          <Menu.Button className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full">
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt={user.user_metadata.full_name || 'User'} 
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <UserCircleIcon className="h-6 w-6" />
            )}
          </Menu.Button>
          
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 border-b border-neutral-200">
                <p className="text-sm font-medium text-neutral-800">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email}
                </p>
              </div>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? 'bg-neutral-100' : ''
                    } text-neutral-700 flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={logout}
                    className={`${
                      active ? 'bg-neutral-100' : ''
                    } text-neutral-700 flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
};

export default Header;