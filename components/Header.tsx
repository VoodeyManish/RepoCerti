import React from 'react';
import { SunIcon, MoonIcon, SparklesIcon, LogoutIcon } from './icons';
import { UserRole } from '../types';

interface HeaderProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  children: React.ReactNode;
  userRole: UserRole;
}

export const Header: React.FC<HeaderProps> = ({
  onLogout,
  isDarkMode,
  toggleDarkMode,
  children,
  userRole
}) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-secondary/80 backdrop-blur-sm shadow-md">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">RepoCerti</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole} Dashboard</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="hidden sm:flex space-x-1 sm:space-x-2 p-1 bg-gray-100 dark:bg-secondary rounded-lg">
              {children}
            </nav>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-secondary-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-secondary-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark"
              aria-label="Logout"
            >
              <LogoutIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
        <div className="sm:hidden pb-2">
           <nav className="flex justify-center space-x-1 sm:space-x-2 p-1 bg-gray-100 dark:bg-secondary rounded-lg">
              {children}
            </nav>
        </div>
      </div>
    </header>
  );
};

export const NavButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark ${
      isActive
        ? 'bg-primary text-white shadow-sm'
        : 'text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-secondary-light'
    }`}
  >
    {children}
  </button>
);