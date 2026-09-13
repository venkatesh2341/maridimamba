import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import AddMemberModal from '../components/AddMemberModal';
import MemberDetailModal from '../components/MemberDetailModal';
import PaymentModal from '../components/PaymentModal';
import { Users, Search, UserPlus, Phone, MapPin, Eye, CheckCircle2, XCircle } from 'lucide-react';

export default function MembersPage() {
  const { isLeader } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getMembers();
      setMembers(res);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleToggleStatus = async (memberId, currentActive) => {
    if (!isLeader) return;
    try {
      await api.toggleMemberStatus(memberId, !currentActive);
      fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to update member status');
    }
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      (m.address && m.address.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterActive === 'ACTIVE') return matchesSearch && m.active;
    if (filterActive === 'INACTIVE') return matchesSearch && !m.active;
    return matchesSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Group Members Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Total {members.length} registered village community members
          </p>
        </div>

        {isLeader && (
          <button onClick={() => setShowAddMember(true)} className="btn btn-primary">
            <UserPlus size={18} /> Add New Member
          </button>
        )}
      </div>

      <div className="card-table-container">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Search by name, phone, or ward..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', fontSize: '0.85rem', width: '260px' }}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '150px', fontSize: '0.85rem' }}
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="ALL">All Status ({members.length})</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filtered.length}</strong> of {members.length}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Member Name</th>
                <th>Phone</th>
                <th>Address / Ward</th>
                <th>Notes / Occupation</th>
                <th>Status</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, textAlign: 'center', color: 'var(--text-muted)' }}>
                      #{m.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {m.name}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                        <Phone size={13} /> {m.phone}
                      </span>
                    </td>
                    <td>{m.address || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{m.notes || '-'}</td>
                    <td>
                      <StatusBadge status={m.active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDate(m.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedMemberId(m.id)}
                          className="btn btn-secondary btn-sm"
                          title="View complete financial profile & loans"
                        >
                          <Eye size={14} /> View History
                        </button>

                        {isLeader && (
                          <button
                            onClick={() => handleToggleStatus(m.id, m.active)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '0.4rem',
                              color: m.active ? '#dc2626' : 'var(--primary-700)',
                              borderColor: m.active ? '#fca5a5' : 'var(--primary-200)'
                            }}
                            title={m.active ? 'Deactivate member' : 'Activate member'}
                          >
                            {m.active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No members match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onRecordPaymentClick={(loan) => setSelectedLoanForPayment(loan)}
          isLeader={isLeader}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={() => fetchMembers()}
        />
      )}

      {/* Payment Modal */}
      {selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
          onSuccess={() => fetchMembers()}
        />
      )}
    </div>
  );
}
