import React, { useState } from 'react';
import { api } from '../services/api';
import { X, UserPlus, AlertCircle } from 'lucide-react';

export default function AddMemberModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Member name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createMember({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Add New Group Member</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Add a village resident to the rotating savings pool
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
            <div className="form-group">
              <label className="form-label" htmlFor="member-name">
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="member-name"
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="member-phone">
                Phone Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="member-phone"
                type="tel"
                className="form-control"
                placeholder="e.g. 9848012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="member-address">
                Address / Village Ward (Optional)
              </label>
              <input
                id="member-address"
                type="text"
                className="form-control"
                placeholder="e.g. Main Street, Ward 2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="member-notes">
                Occupation / Notes (Optional)
              </label>
              <input
                id="member-notes"
                type="text"
                className="form-control"
                placeholder="e.g. Farmer, Carpenter, Shopkeeper"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <UserPlus size={18} />
              <span>{loading ? 'Adding...' : 'Add Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
