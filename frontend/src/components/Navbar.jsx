import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  RotateCw, 
  Receipt, 
  BookOpen, 
  FileSpreadsheet, 
  ShieldCheck, 
  LogOut, 
  Crown, 
  Eye, 
  AlertCircle 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isLeader } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cycles', label: 'Monthly Cycles', icon: RotateCw },
    { id: 'loans', label: 'Loans & Repayments', icon: Receipt },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'ledger', label: 'Group Ledger', icon: BookOpen },
    { id: 'reports', label: 'Monthly Reports', icon: FileSpreadsheet },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  return (
    <header className="navbar">
      {/* Member Read-Only Transparency Banner */}
      {!isLeader && (
        <div className="transparency-banner">
          <div className="transparency-banner-text">
            <Eye size={16} />
            <span>
              <strong>Transparency Mode Active:</strong> You have complete visibility to inspect group funds, loans, and ledger. Financial changes can only be made by the Group Leader.
            </span>
          </div>
        </div>
      )}

      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-group" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div className="brand-logo">
            <span>₹</span>
          </div>
          <div>
            <div className="brand-title">Maridimamba</div>
            <div className="brand-subtitle">Village Group Money Management</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="user-nav-group">
          {isLeader ? (
            <span className="role-badge leader" title="Leader has full write and operational permissions">
              <Crown size={14} /> Group Leader
            </span>
          ) : (
            <span className="role-badge member" title="Member has full read transparency across all records">
              <Eye size={14} /> Member View
            </span>
          )}

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {user?.fullName || user?.username}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              @{user?.username}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Logout of session"
            style={{ gap: '0.35rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
