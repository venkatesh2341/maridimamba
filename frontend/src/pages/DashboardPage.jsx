import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PaymentModal from '../components/PaymentModal';
import AddMemberModal from '../components/AddMemberModal';
import CycleWizardModal from '../components/CycleWizardModal';
import CloseMonthModal from '../components/CloseMonthModal';
import MemberDetailModal from '../components/MemberDetailModal';
import RecordDeductionModal from '../components/RecordDeductionModal';
import { 
  Wallet, 
  Send, 
  PiggyBank, 
  TrendingUp, 
  PlusCircle, 
  ArrowUpRight, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RotateCw,
  Search,
  HeartHandshake
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { isLeader } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCycleWizard, setShowCycleWizard] = useState(false);
  const [showCloseMonth, setShowCloseMonth] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading village money management dashboard...
      </div>
    );
  }

  const activeLoans = data?.activeLoans || [];
  const filteredLoans = activeLoans.filter(l =>
    l.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.chunkNumber?.toString().includes(searchTerm)
  );

  const collectionPercentage = data?.expectedRepayment > 0
    ? Math.min(100, Math.round((data.totalCollected / data.expectedRepayment) * 100))
    : 0;

  return (
    <div>
      {/* 4 Primary Cards (Section 15) */}
      <div className="metrics-grid-4">
        <StatCard
          title="Group Liquid Balance"
          value={formatRupees(data?.groupBalance)}
          subtext="Actual cash in hand ledger balance"
          icon={Wallet}
          theme="emerald"
        />

        <StatCard
          title="Currently Lent Out"
          value={formatRupees(data?.currentlyLent)}
          subtext={`Principal actively distributed across ${data?.activeLoansCount || 0} chunks`}
          icon={Send}
          theme="blue"
        />

        <StatCard
          title="Reserve Pool"
          value={formatRupees(data?.reservePool)}
          subtext="Retained group money (Leader decided)"
          icon={PiggyBank}
          theme="amber"
        />

        <StatCard
          title="Total Interest Earned"
          value={formatRupees(data?.interestEarned)}
          subtext="All accumulated group returns"
          icon={TrendingUp}
          theme="purple"
        />
      </div>

      {/* Active Cycle Hero Panel */}
      {data?.currentCycleId ? (
        <div className="cycle-hero-card">
          <div className="cycle-hero-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 className="cycle-title">{data.currentCycleName}</h2>
                <StatusBadge status={data.currentCycleStatus} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Active monthly rotating cycle &bull; {data.activeLoansCount} Members Participating
              </p>
            </div>

            {/* Leader Quick Actions */}
            {isLeader ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowAddMember(true)} className="btn btn-secondary btn-sm">
                  <UserPlus size={16} /> Add Member
                </button>

                <button
                  onClick={() => setShowDeductionModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                  title="Deduct money from liquid balance for donation or community expense"
                >
                  <HeartHandshake size={16} /> Record Deduction
                </button>

                <button onClick={() => setShowCloseMonth(true)} className="btn btn-accent btn-sm">
                  <CheckCircle size={16} /> Close Month
                </button>
              </div>
            ) : (
              <span className="role-badge member">
                Read-Only Inspection
              </span>
            )}
          </div>

          {/* Repayment Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Repayment Collection Progress ({collectionPercentage}%)</span>
              <span className="currency">
                {formatRupees(data.totalCollected)} / {formatRupees(data.expectedRepayment)}
              </span>
            </div>

            <div className="cycle-progress-bar-container">
              <div className="cycle-progress-bar-fill" style={{ width: `${collectionPercentage}%` }}></div>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="cycle-stats-row">
            <div>
              <div className="cycle-stat-item-label">Expected Total</div>
              <div className="cycle-stat-item-value currency">{formatRupees(data.expectedRepayment)}</div>
            </div>

            <div>
              <div className="cycle-stat-item-label">Actual Collected</div>
              <div className="cycle-stat-item-value currency" style={{ color: 'var(--primary-700)' }}>
                {formatRupees(data.totalCollected)}
              </div>
            </div>

            <div>
              <div className="cycle-stat-item-label">Outstanding Balance</div>
              <div className="cycle-stat-item-value currency" style={{ color: '#dc2626' }}>
                {formatRupees(data.outstandingAmount)}
              </div>
            </div>

            <div>
              <div className="cycle-stat-item-label">Pending Loans</div>
              <div className="cycle-stat-item-value">
                {data.pendingLoansCount} of {data.activeLoansCount}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="cycle-hero-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-900)' }}>No Monthly Cycle Currently Active</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
            Current available group balance is <strong>{formatRupees(data?.groupBalance)}</strong>.
          </p>
          {isLeader && (
            <button onClick={() => setShowCycleWizard(true)} className="btn btn-primary btn-lg">
              <PlusCircle size={20} /> Start New Month
            </button>
          )}
        </div>
      )}

      {/* Active Loans Section */}
      <div className="card-table-container">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {data?.currentCycleName || 'Active'} Member Loans & Chunks
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing all chunks assigned for the current monthly rotation
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Search member or chunk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', fontSize: '0.85rem', width: '220px' }}
              />
            </div>

            {isLeader && (
              <button
                onClick={() => setShowCycleWizard(true)}
                className="btn btn-primary btn-sm"
                title="Start next cycle or adjust allocations"
              >
                <PlusCircle size={16} /> New Month
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Chunk</th>
                <th>Member Name</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Total Due</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>
                      #{loan.chunkNumber}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedMemberId(loan.memberId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-800)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {loan.memberName}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {loan.memberPhone}
                      </div>
                    </td>
                    <td className="currency">{formatRupees(loan.principalAmount)}</td>
                    <td className="currency">{formatRupees(loan.interestAmount)}</td>
                    <td className="currency" style={{ fontWeight: 700 }}>
                      {formatRupees(loan.totalDue)}
                    </td>
                    <td className="currency" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                      {formatRupees(loan.amountPaid)}
                    </td>
                    <td className="currency" style={{ color: loan.remainingAmount > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: 700 }}>
                      {formatRupees(loan.remainingAmount)}
                    </td>
                    <td>
                      <StatusBadge status={loan.status} />
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatDate(loan.dueDate)}
                    </td>
                    <td>
                      {isLeader ? (
                        loan.status !== 'PAID' ? (
                          <button
                            onClick={() => setSelectedLoanForPayment(loan)}
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
                          onClick={() => setSelectedMemberId(loan.memberId)}
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
                  <td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No loans match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
          onSuccess={() => {
            fetchDashboard();
          }}
        />
      )}

      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          onRecordPaymentClick={(loan) => setSelectedLoanForPayment(loan)}
          isLeader={isLeader}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            fetchDashboard();
          }}
        />
      )}

      {showCycleWizard && (
        <CycleWizardModal
          onClose={() => setShowCycleWizard(false)}
          onSuccess={() => {
            fetchDashboard();
          }}
        />
      )}

      {showCloseMonth && data?.currentCycleId && (
        <CloseMonthModal
          cycleId={data.currentCycleId}
          onClose={() => setShowCloseMonth(false)}
          onSuccess={() => {
            fetchDashboard();
          }}
        />
      )}

      {showDeductionModal && (
        <RecordDeductionModal
          currentBalance={data?.groupBalance || 0}
          onClose={() => setShowDeductionModal(false)}
          onSuccess={() => {
            setShowDeductionModal(false);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}
