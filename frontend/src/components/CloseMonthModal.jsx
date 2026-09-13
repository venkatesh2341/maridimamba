import React, { useState, useEffect } from 'react';
import { api, formatRupees } from '../services/api';
import { X, CheckCircle, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function CloseMonthModal({ cycleId, onClose, onSuccess }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [confirmUnpaid, setConfirmUnpaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.getCycleSummary(cycleId);
        setSummary(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch cycle summary');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [cycleId]);

  const handleCloseMonth = async (e) => {
    e.preventDefault();
    if (summary.unpaidLoansCount > 0 && !confirmUnpaid) {
      setError('Please check the confirmation box to acknowledge closing with outstanding loans.');
      return;
    }

    setClosing(true);
    setError(null);

    try {
      await api.closeCycle(cycleId, confirmUnpaid, notes.trim() || undefined);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to close monthly cycle');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading cycle financial closure summary...
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Close Monthly Cycle: {summary?.cycleName}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Finalize accounts, compute closing balance, and carry forward to next month
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCloseMonth}>
          <div className="modal-body">
            {/* Financial Summary Table */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}
            >
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--primary-900)' }}>
                Month-End Reconciliation
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Opening Balance:</span>
                  <strong className="currency">{formatRupees(summary?.openingBalance)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Lent:</span>
                  <strong className="currency">{formatRupees(summary?.lendingAmount)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Repayment:</span>
                  <strong className="currency">{formatRupees(summary?.expectedRepayment)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Interest:</span>
                  <strong className="currency">{formatRupees(summary?.expectedInterest)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>Actual Amount Received:</span>
                  <strong className="currency" style={{ color: 'var(--primary-700)' }}>
                    {formatRupees(summary?.actualAmountReceived)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>Reserve Retained:</span>
                  <strong className="currency" style={{ color: '#d97706' }}>
                    {formatRupees(summary?.reserveAmount)}
                  </strong>
                </div>
              </div>

              {/* Final Closing Balance Highlight */}
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                    Final Closing Cash Balance:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Reserve ({formatRupees(summary?.reserveAmount)}) + Actual Repayments ({formatRupees(summary?.actualAmountReceived)})
                  </div>
                </div>
                <div className="currency" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  {formatRupees(summary?.closingBalance)}
                </div>
              </div>
            </div>

            {/* Unpaid Loans Alert */}
            {summary?.unpaidLoansCount > 0 ? (
              <div className="alert alert-warning" style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <AlertTriangle size={18} />
                  <span>Warning: {summary.unpaidLoansCount} Member Loan(s) Still Unpaid!</span>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Total Outstanding Uncollected: <strong>{formatRupees(summary?.outstandingAmount)}</strong>. Uncollected amounts will remain recorded on the respective members' profiles.
                </div>

                <div className="table-responsive" style={{ maxHeight: '160px', overflowY: 'auto', background: '#ffffff', borderRadius: 'var(--radius-sm)' }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Chunk</th>
                        <th>Member</th>
                        <th>Total Due</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.unpaidLoans.map((l) => (
                        <tr key={l.id}>
                          <td>#{l.chunkNumber}</td>
                          <td><strong>{l.memberName}</strong></td>
                          <td className="currency">{formatRupees(l.totalDue)}</td>
                          <td className="currency">{formatRupees(l.amountPaid)}</td>
                          <td className="currency" style={{ color: '#dc2626', fontWeight: 700 }}>{formatRupees(l.remainingAmount)}</td>
                          <td>{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={confirmUnpaid}
                    onChange={(e) => setConfirmUnpaid(e.target.checked)}
                  />
                  <span>I confirm closing this cycle with {summary.unpaidLoansCount} outstanding loans.</span>
                </label>
              </div>
            ) : (
              <div className="alert alert-info">
                <CheckCircle size={18} />
                <span>All member loans and interest have been 100% collected! Ready to close smoothly.</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="close-notes">
                Closing Remarks / Notes (Optional)
              </label>
              <input
                id="close-notes"
                type="text"
                className="form-control"
                placeholder="e.g. Month closed successfully, carried to next cycle"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={closing}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={closing || (summary?.unpaidLoansCount > 0 && !confirmUnpaid)}
            >
              <ShieldAlert size={18} />
              <span>{closing ? 'Closing Month...' : 'Close Month & Lock Records'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
