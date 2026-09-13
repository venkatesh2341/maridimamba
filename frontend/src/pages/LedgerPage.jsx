import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDateTime } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RecordDeductionModal from '../components/RecordDeductionModal';
import { BookOpen, Search, ArrowDownLeft, ArrowUpRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function LedgerPage() {
  const { isLeader } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeductionModal, setShowDeductionModal] = useState(false);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.getLedger();
      setTransactions(res);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || t.transactionType === typeFilter;
    return matchesSearch && matchesType;
  });

  const latestBalance = transactions.length > 0 ? transactions[0].runningBalance : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Complete Financial Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Auditable double-entry record answering: <em>"Where did the group's money go?"</em>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLeader && (
            <button
              onClick={() => setShowDeductionModal(true)}
              className="btn btn-danger"
              style={{
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <HeartHandshake size={18} />
              Record Deduction / Donation
            </button>
          )}

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.25rem',
              textAlign: 'right',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Current Liquid Cash in Hand
            </div>
            <div className="currency" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>
              {formatRupees(latestBalance)}
            </div>
          </div>
        </div>
      </div>

      <div className="card-table-container">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', fontSize: '0.85rem', width: '260px' }}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '200px', fontSize: '0.85rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Movement Types</option>
              <option value="OPENING_BALANCE">Opening Balances</option>
              <option value="LOAN_DISBURSEMENT">Disbursements (Outflows -)</option>
              <option value="LOAN_REPAYMENT">Repayments (Inflows +)</option>
              <option value="OTHER_INCOME">Other Income</option>
              <option value="OTHER_EXPENSE">Expenses</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filtered.length}</strong> movements
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Date & Time</th>
                <th>Cycle</th>
                <th>Movement Type</th>
                <th>Description</th>
                <th>Recorded By</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((t) => {
                  const isPositive = parseFloat(t.amount) > 0;
                  const isZero = parseFloat(t.amount) === 0;

                  return (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{t.id}</td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(t.transactionDate)}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {t.cycleName || '-'}
                      </td>
                      <td>
                        <span
                          className="status-pill"
                          style={{
                            fontSize: '0.725rem',
                            backgroundColor: isPositive ? 'var(--status-paid-bg)' : isZero ? '#f1f5f9' : '#fef2f2',
                            color: isPositive ? 'var(--status-paid-text)' : isZero ? '#475569' : '#b91c1c',
                            borderColor: isPositive ? 'var(--status-paid-border)' : isZero ? '#cbd5e1' : '#fca5a5'
                          }}
                        >
                          {t.transactionType}
                        </span>
                      </td>
                      <td style={{ maxWidth: '340px' }}>{t.description}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{t.createdBy}</td>
                      <td
                        className="currency"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: isPositive ? 'var(--primary-700)' : isZero ? 'var(--text-muted)' : '#dc2626'
                        }}
                      >
                        {isPositive ? `+${formatRupees(t.amount)}` : formatRupees(t.amount)}
                      </td>
                      <td
                        className="currency"
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: 'var(--text-main)'
                        }}
                      >
                        {formatRupees(t.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No ledger transactions found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeductionModal && (
        <RecordDeductionModal
          currentBalance={latestBalance}
          onClose={() => setShowDeductionModal(false)}
          onSuccess={() => {
            setShowDeductionModal(false);
            fetchLedger();
          }}
        />
      )}
    </div>
  );
}
