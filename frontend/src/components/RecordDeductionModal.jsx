import React, { useState } from 'react';
import { api, formatRupees } from '../services/api';
import { X, HeartHandshake, AlertCircle, CheckCircle, ArrowDownRight } from 'lucide-react';

export default function RecordDeductionModal({ currentBalance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [cause, setCause] = useState('');
  const [category, setCategory] = useState('DONATION');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const numAmount = parseFloat(amount) || 0;
  const numCurrent = parseFloat(currentBalance) || 0;
  const newBalance = numCurrent - numAmount;
  const isOverBalance = numAmount > numCurrent;

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (isOverBalance) {
      setError(`Reduction amount (${formatRupees(numAmount)}) cannot exceed current liquid cash (${formatRupees(numCurrent)}).`);
      return;
    }
    if (!cause.trim()) {
      setError('Cause or purpose for reducing group balance is mandatory.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.recordDeduction({
        amount: numAmount,
        cause: cause.trim(),
        category,
        date,
        notes: notes.trim() || undefined
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to record balance deduction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HeartHandshake size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Record Balance Deduction</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Donations, community welfare & expenditures with cause
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#b91c1c',
                  fontSize: '0.85rem'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Current liquid balance card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Current Liquid Group Balance
                </div>
                <div className="currency" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  {formatRupees(numCurrent)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  After Deduction
                </div>
                <div
                  className="currency"
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: isOverBalance ? '#dc2626' : 'var(--text-main)'
                  }}
                >
                  {formatRupees(Math.max(0, newBalance))}
                </div>
              </div>
            </div>

            {/* Reduction Amount */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Reduction Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 10,
                    fontWeight: 700,
                    color: 'var(--text-muted)'
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="e.g. 2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>

              {/* Quick amount pills */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {quickAmounts.map((qa) => (
                  <button
                    key={qa}
                    type="button"
                    onClick={() => setAmount(qa.toString())}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    +₹{qa.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-control"
              >
                <option value="DONATION">Donation (Temple / School / Charity)</option>
                <option value="COMMUNITY_WELFARE">Community Welfare / Festival</option>
                <option value="VILLAGE_MAINTENANCE">Village Maintenance & Repairs</option>
                <option value="EMERGENCY_AID">Member Emergency Assistance</option>
                <option value="ADMINISTRATIVE">Administrative / Group Meetings</option>
                <option value="OTHER_EXPENSE">Other Expenditure</option>
              </select>
            </div>

            {/* Cause (Mandatory) */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                Cause / Purpose for Reduction <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Village Temple Annual Mahotsavam festival donation"
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                className="form-control"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Village rule: A clear cause is permanently recorded in the ledger for full member transparency.
              </span>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-control"
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Additional Notes (Optional)</label>
              <textarea
                rows="2"
                placeholder="Any additional details or receipts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading || numAmount <= 0 || isOverBalance || !cause.trim()}
              style={{
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowDownRight size={16} />
              {loading ? 'Recording...' : `Confirm & Deduct ${formatRupees(numAmount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
