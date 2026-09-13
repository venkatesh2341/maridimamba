import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PaymentModal from '../components/PaymentModal';
import MemberDetailModal from '../components/MemberDetailModal';
import { Receipt, Search, Filter, CheckCircle2 } from 'lucide-react';

export default function LoansPage() {
  const { isLeader } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.getLoans(statusFilter || undefined);
      setLoans(res);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const filtered = loans.filter((l) =>
    l.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.chunkNumber?.toString().includes(searchTerm) ||
    l.cycleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Loans & Payment Tracking</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Monitor chunk disbursements, interest rates, and individual repayment status
          </p>
        </div>
      </div>

      <div className="card-table-container">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Search member, chunk, or cycle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', fontSize: '0.85rem', width: '260px' }}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '180px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses ({loans.length})</option>
              <option value="PENDING">Pending Only</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid in Full</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filtered.length}</strong> loans
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cycle</th>
                <th style={{ width: '60px' }}>Chunk</th>
                <th>Member Name</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Total Due</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{l.cycleName}</span>
                    </td>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>#{l.chunkNumber}</td>
                    <td>
                      <button
                        onClick={() => setSelectedMemberId(l.memberId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-800)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {l.memberName}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.memberPhone}</div>
                    </td>
                    <td className="currency">{formatRupees(l.principalAmount)}</td>
                    <td className="currency">{formatRupees(l.interestAmount)}</td>
                    <td className="currency" style={{ fontWeight: 700 }}>{formatRupees(l.totalDue)}</td>
                    <td className="currency" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{formatRupees(l.amountPaid)}</td>
                    <td className="currency" style={{ color: l.remainingAmount > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: 700 }}>
                      {formatRupees(l.remainingAmount)}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(l.dueDate)}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      {isLeader ? (
                        l.status !== 'PAID' ? (
                          <button
                            onClick={() => setSelectedLoanForPayment(l)}
                            className="btn btn-primary btn-sm"
                          >
                            Record Pay
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                            Settled ✓
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => setSelectedMemberId(l.memberId)}
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No loans found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
          onSuccess={() => fetchLoans()}
        />
      )}

      {/* Member Details Modal */}
      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onRecordPaymentClick={(loan) => setSelectedLoanForPayment(loan)}
          isLeader={isLeader}
        />
      )}
    </div>
  );
}
