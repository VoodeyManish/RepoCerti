import React, { useState } from 'react';
import { Header, NavButton } from './Header';
import { ReportGenerator } from './ReportGenerator';
import { BulkCertificateVerifier } from './BulkCertificateVerifier';
import { StaffModule } from '../types';

interface StaffDashboardProps {
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onLogout, isDarkMode, toggleDarkMode }) => {
  const [activeModule, setActiveModule] = useState<StaffModule>(StaffModule.BulkVerify);

  return (
    <>
      <Header 
        userRole="staff"
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      >
        <NavButton
            isActive={activeModule === StaffModule.BulkVerify}
            onClick={() => setActiveModule(StaffModule.BulkVerify)}
        >
            Bulk Verifier
        </NavButton>
        <NavButton
            isActive={activeModule === StaffModule.Report}
            onClick={() => setActiveModule(StaffModule.Report)}
        >
            Report Generator
        </NavButton>
      </Header>
      <main className="p-4 sm:p-6 md:p-8">
        {activeModule === StaffModule.BulkVerify && <BulkCertificateVerifier />}
        {activeModule === StaffModule.Report && <ReportGenerator />}
      </main>
    </>
  );
};