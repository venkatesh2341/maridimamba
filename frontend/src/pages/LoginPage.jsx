import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, Eye, LogIn, AlertCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('leader');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="brand-logo"
            style={{ width: 56, height: 56, fontSize: '1.75rem', margin: '0 auto 1rem', borderRadius: '16px' }}
          >
            <span>₹</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Maridimamba
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Village Group Money Management System
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            <LogIn size={20} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
            One-Click Test Access:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('leader', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', padding: '0.65rem 0.5rem', height: 'auto', border: username === 'leader' ? '2px solid var(--primary-600)' : '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                <Crown size={14} color="#d97706" /> Leader
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>leader / admin123</div>
              <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>Full Control</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('member', 'member123')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', padding: '0.65rem 0.5rem', height: 'auto', border: username === 'member' ? '2px solid var(--primary-600)' : '1px solid var(--border-color)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0369a1' }}>
                <Eye size={14} /> Member
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>member / member123</div>
              <div style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600, marginTop: '0.2rem' }}>Read-Only Transparency</div>
            </button>
          </div>
        </div>

        {/* Security & Access policy note */}
        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
          <Shield size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          All members can see group balance and ledger. Only group leader can modify data or disburse money.
        </div>
      </div>
    </div>
  );
}
