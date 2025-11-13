import React, { useState } from 'react';
import { Header, NavButton } from './Header';
import { ReportGenerator } from './ReportGenerator';
import { CertificateExtractor } from './CertificateExtractor';
import { ActiveModule } from '../types';

interface StudentDashboardProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout, isDarkMode, toggleDarkMode }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>(ActiveModule.Report);

  return (
    <>
      <Header 
        userRole="student"
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      >
        <NavButton
            isActive={activeModule === ActiveModule.Report}
            onClick={() => setActiveModule(ActiveModule.Report)}
        >
            Report Generator
        </NavButton>
        <NavButton
            isActive={activeModule === ActiveModule.Certificate}
            onClick={() => setActiveModule(ActiveModule.Certificate)}
        >
            Certificate Extractor
        </NavButton>
      </Header>
      <main className="p-4 sm:p-6 md:p-8">
        {activeModule === ActiveModule.Report && <ReportGenerator />}
        {activeModule === ActiveModule.Certificate && <CertificateExtractor />}
      </main>
    </>
  );
};