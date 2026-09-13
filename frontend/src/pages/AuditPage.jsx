import React, { useState, useEffect } from 'react';
import { api, formatDateTime } from '../services/api';
import { ShieldCheck, Search } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.newValue && log.newValue.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Audit & Accountability Log</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Immutable record of all financial allocations, repayments, cycle updates, and member modifications
          </p>
        </div>
      </div>

      <div className="card-table-container">
        <div className="card-header">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search action or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2rem', fontSize: '0.85rem', width: '260px' }}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filtered.length}</strong> logged actions
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Log ID</th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Previous State</th>
                <th>New / Modified State</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{l.id}</td>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDateTime(l.createdAt)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-800)' }}>@{l.userId}</span>
                    </td>
                    <td>
                      <span
                        className="status-pill"
                        style={{ fontSize: '0.725rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {l.entityType} {l.entityId ? `(#${l.entityId})` : ''}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      {l.oldValue || '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500, maxWidth: '280px' }}>
                      {l.newValue || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
