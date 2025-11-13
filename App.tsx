import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { UserRole } from './types';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  const renderContent = () => {
    if (!userRole) {
      return <LoginPage onLogin={handleLogin} />;
    }
    
    const commonProps = {
      isDarkMode,
      toggleDarkMode,
      onLogout: handleLogout,
    };
    
    if (userRole === 'student') {
      return <StudentDashboard {...commonProps} />;
    }
    
    if (userRole === 'staff') {
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