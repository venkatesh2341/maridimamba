import React, { useState } from 'react';
import { api, formatRupees } from '../services/api';
import { X, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';

export default function PaymentModal({ loan, onClose, onSuccess }) {
  const [amount, setAmount] = useState(loan.remainingAmount);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const numAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = Math.max(0, loan.remainingAmount - numAmount);
  const isOverpaying = numAmount > loan.remainingAmount;
  const isInvalidAmount = numAmount <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isInvalidAmount) {
      setError('Please enter an amount greater than zero.');
      return;
    }
    if (isOverpaying) {
      setError(`Payment cannot exceed the remaining balance (${formatRupees(loan.remainingAmount)}).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.recordPayment(loan.id, {
        amount: numAmount,
        notes: notes.trim() || undefined
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Record Repayment</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Chunk #{loan.chunkNumber} &bull; {loan.memberName} ({loan.memberPhone})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Financial Status Summary */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Due
                </div>
                <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {formatRupees(loan.totalDue)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  (₹{loan.principalAmount} + ₹{loan.interestAmount})
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Already Paid
                </div>
                <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                  {formatRupees(loan.amountPaid)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Remaining
                </div>
                <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626' }}>
                  {formatRupees(loan.remainingAmount)}
                </div>
              </div>
            </div>

            {/* Quick Fill Buttons */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                QUICK SELECTION:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setAmount(loan.remainingAmount)}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'var(--primary-500)', color: 'var(--primary-700)' }}
                >
                  Full Payment ({formatRupees(loan.remainingAmount)})
                </button>

                {loan.remainingAmount > 1000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(loan.remainingAmount / 2))}
                    className="btn btn-secondary btn-sm"
                  >
                    Half ({formatRupees(Math.round(loan.remainingAmount / 2))})
                  </button>
                )}
              </div>
            </div>

            {/* Input Amount */}
            <div className="form-group">
              <label className="form-label" htmlFor="payment-amount">
                Payment Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="payment-amount"
                  type="number"
                  step="1"
                  min="1"
                  max={loan.remainingAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              {/* Dynamic preview */}
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Remaining after this payment:</span>
                <strong className="currency" style={{ color: remainingAfterPayment === 0 ? 'var(--primary-700)' : '#dc2626' }}>
                  {formatRupees(remainingAfterPayment)} {remainingAfterPayment === 0 && '🟢 (Fully Settled)'}
                </strong>
              </div>

              {isOverpaying && (
                <div className="form-error">
                  Cannot exceed remaining balance of {formatRupees(loan.remainingAmount)}.
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="payment-notes">
                Payment Notes / Reference (Optional)
              </label>
              <input
                id="payment-notes"
                type="text"
                placeholder="e.g. Cash in person, GPay / PhonePe transfer, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
              />
            </div>

            {error && (
              <div className="alert alert-danger" style={{ padding: '0.75rem 1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || isOverpaying || isInvalidAmount}
            >
              <CheckCircle size={18} />
              <span>{loading ? 'Recording...' : `Confirm Payment ${formatRupees(numAmount)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
