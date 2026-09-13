import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDate } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import CycleWizardModal from '../components/CycleWizardModal';
import CloseMonthModal from '../components/CloseMonthModal';
import { RotateCw, PlusCircle, CheckCircle, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

export default function CyclesPage({ onNavigateToReport }) {
  const { isLeader } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [closingCycleId, setClosingCycleId] = useState(null);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await api.getCycles();
      setCycles(res);
    } catch (err) {
      console.error('Error fetching cycles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const hasOpenCycle = cycles.some(c => c.status === 'OPEN');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Monthly Rotating Cycles</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            History of rotating month pools, lending distributions, reserves, and reconciliations
          </p>
        </div>

        {isLeader && (
          <button
            onClick={() => setShowWizard(true)}
            className="btn btn-primary"
            disabled={hasOpenCycle}
            title={hasOpenCycle ? 'Please close the current OPEN cycle before starting a new one.' : 'Start new month'}
          >
            <PlusCircle size={18} /> Start New Month
          </button>
        )}
      </div>

      {hasOpenCycle && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <div>
            <strong>Active Cycle Running:</strong> Close the currently open cycle to finalize its closing balance before creating the subsequent month.
          </div>
        </div>
      )}

      {/* Cycles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {cycles.map((cycle) => {
          const isOpen = cycle.status === 'OPEN';
          return (
            <div
              key={cycle.id}
              style={{
                background: '#ffffff',
                border: isOpen ? '2px solid var(--primary-500)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isOpen ? 'var(--primary-100)' : '#f1f5f9',
                      color: isOpen ? 'var(--primary-800)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.35rem' }}>{cycle.cycleName}</h3>
                      <StatusBadge status={cycle.status} />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Duration: {formatDate(cycle.startDate)} to {formatDate(cycle.endDate)} &bull; {cycle.numberOfChunks} Chunks of {formatRupees(cycle.chunkAmount)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => onNavigateToReport && onNavigateToReport(cycle.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Full Statement</span> <ArrowRight size={14} />
                  </button>

                  {isOpen && isLeader && (
                    <button
                      onClick={() => setClosingCycleId(cycle.id)}
                      className="btn btn-accent btn-sm"
                    >
                      <CheckCircle size={15} /> Close Month
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Breakdown Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                  marginTop: '1.25rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Opening Balance</div>
                  <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatRupees(cycle.openingBalance)}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Lent</div>
                  <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0369a1' }}>{formatRupees(cycle.lendingAmount)}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reserve Kept</div>
                  <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#d97706' }}>{formatRupees(cycle.reserveAmount)}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Actual Collected</div>
                  <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                    {formatRupees(cycle.actualRepaymentReceived)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding</div>
                  <div className="currency" style={{ fontSize: '1.15rem', fontWeight: 700, color: cycle.outstandingAmount > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                    {formatRupees(cycle.outstandingAmount)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {isOpen ? 'Current Est. Closing' : 'Carried Closing Balance'}
                  </div>
                  <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    {formatRupees(cycle.closingBalance || (cycle.reserveAmount + cycle.actualRepaymentReceived))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Cycle Wizard */}
      {showWizard && (
        <CycleWizardModal
          onClose={() => setShowWizard(false)}
          onSuccess={() => fetchCycles()}
        />
      )}

      {/* Close Month Modal */}
      {closingCycleId && (
        <CloseMonthModal
          cycleId={closingCycleId}
          onClose={() => setClosingCycleId(null)}
          onSuccess={() => fetchCycles()}
        />
      )}
    </div>
  );
}
