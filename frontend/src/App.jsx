import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CyclesPage from './pages/CyclesPage';
import LoansPage from './pages/LoansPage';
import MembersPage from './pages/MembersPage';
import LedgerPage from './pages/LedgerPage';
import ReportsPage from './pages/ReportsPage';
import AuditPage from './pages/AuditPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [targetReportCycleId, setTargetReportCycleId] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--surface-bg)',
          fontSize: '1.1rem',
          color: 'var(--text-muted)'
        }}
      >
        Initializing Maridimamba...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const navigateToReport = (cycleId) => {
    setTargetReportCycleId(cycleId);
    setActiveTab('reports');
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'cycles' && <CyclesPage onNavigateToReport={navigateToReport} />}
        {activeTab === 'loans' && <LoansPage />}
        {activeTab === 'members' && <MembersPage />}
        {activeTab === 'ledger' && <LedgerPage />}
        {activeTab === 'reports' && <ReportsPage initialCycleId={targetReportCycleId} />}
        {activeTab === 'audit' && <AuditPage />}
      </main>

      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>
          <strong>Maridimamba</strong> &bull; Production-Grade Village Group Money Management Application
        </div>
        <div style={{ marginTop: '0.25rem' }}>
          Backend: Java 17 Spring Boot &bull; Database: PostgreSQL / Flyway &bull; Frontend: React &bull; RBAC: Leader & Member Transparency
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
