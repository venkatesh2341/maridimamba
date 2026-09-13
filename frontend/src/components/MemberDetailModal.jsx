import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDate } from '../services/api';
import StatusBadge from './StatusBadge';
import { X, User, Phone, MapPin, AlertCircle, Clock } from 'lucide-react';

export default function MemberDetailModal({ memberId, onClose, onRecordPaymentClick, isLeader }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.getMemberDetails(memberId);
        setDetails(res);
      } catch (err) {
        setError(err.message || 'Failed to load member details');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [memberId]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading member records...
        </div>
      </div>
    );
  }

  const m = details?.member;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem'
              }}
            >
              {m?.name?.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem' }}>{m?.name}</h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Phone size={13} /> {m?.phone}
                </span>
                {m?.address && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={13} /> {m?.address}
                  </span>
                )}
                <StatusBadge status={m?.active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Member 5 Key Financial Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Borrowed</div>
              <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>{formatRupees(details?.totalBorrowed)}</div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-800)', textTransform: 'uppercase', fontWeight: 600 }}>Total Repaid</div>
              <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-700)', marginTop: '0.25rem' }}>{formatRupees(details?.totalRepaid)}</div>
            </div>

            <div style={{ background: '#fef3c7', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>Interest Paid</div>
              <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b45309', marginTop: '0.25rem' }}>{formatRupees(details?.totalInterestPaid)}</div>
            </div>

            <div style={{ background: '#fef2f2', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding</div>
              <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>{formatRupees(details?.outstandingAmount)}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Loans</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>{details?.numberOfLoans}</div>
            </div>
          </div>

          {/* Complete Loan History */}
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Complete Loan & Repayment History
          </h4>

          {details?.loanHistory && details.loanHistory.length > 0 ? (
            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Chunk</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total Due</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    {isLeader && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {details.loanHistory.map((l) => (
                    <tr key={l.id}>
                      <td><strong>{l.cycleName}</strong></td>
                      <td>#{l.chunkNumber}</td>
                      <td className="currency">{formatRupees(l.principalAmount)}</td>
                      <td className="currency">{formatRupees(l.interestAmount)}</td>
                      <td className="currency" style={{ fontWeight: 600 }}>{formatRupees(l.totalDue)}</td>
                      <td className="currency" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{formatRupees(l.amountPaid)}</td>
                      <td className="currency" style={{ color: l.remainingAmount > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: 700 }}>
                        {formatRupees(l.remainingAmount)}
                      </td>
                      <td><StatusBadge status={l.status} /></td>
                      {isLeader && (
                        <td>
                          {l.status !== 'PAID' && (
                            <button
                              onClick={() => {
                                onClose();
                                onRecordPaymentClick(l);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              No loan history recorded for this member.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
