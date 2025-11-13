import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { StudentDashboard } from './components/StudentDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { User } from './types';
import { getCurrentUser, logoutUser } from './services/authService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Check for a logged-in user on initial load
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const renderContent = () => {
    if (!currentUser) {
      return <AuthPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    const commonProps = {
      isDarkMode,
      toggleDarkMode,
      onLogout: handleLogout,
      user: currentUser,
    };
    
    if (currentUser.role === 'student') {
      return <StudentDashboard {...commonProps} />;
    }
    
    if (currentUser.role === 'staff') {
      return <StaffDashboard {...commonProps} />;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark transition-colors duration-300 font-sans">
      {renderContent()}
    </div>
  );
};

export default App;
