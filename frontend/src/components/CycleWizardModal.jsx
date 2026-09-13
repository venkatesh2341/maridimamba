import { useState, useEffect } from 'react';
import { api, formatRupees } from '../services/api';
import { X, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function CycleWizardModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const defaultCycleName = nextMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const defaultStartDate = nextMonth.toISOString().split('T')[0];
  const defaultEndDate = nextMonthEnd.toISOString().split('T')[0];

  const [cycleName, setCycleName] = useState(defaultCycleName);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [lendingAmount, setLendingAmount] = useState('50000');
  const [defaultInterest, setDefaultInterest] = useState('500');
  const [notes, setNotes] = useState('');

  // Flexible 10k & 5k Chunk Composition State
  const [chunkMode, setChunkMode] = useState('MIXED'); // 'MIXED', 'ALL_5K', 'ALL_10K'
  const [count10k, setCount10k] = useState(2);
  const [count5k, setCount5k] = useState(6);

  // Chunk assignments: array of { chunkNumber, memberId, principalAmount, interestAmount, dueDate, notes, denomination }
  const [chunkAssignments, setChunkAssignments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, membersRes] = await Promise.all([
          api.getAvailableBalance(),
          api.getActiveMembers()
        ]);
        const bal = balRes.availableBalance || 50000;
        setAvailableBalance(bal);
        const maxChunksLend = Math.floor(bal / 5000) * 5000;
        const initLend = maxChunksLend > 0 ? maxChunksLend : Math.min(bal, 50000);
        setLendingAmount(initLend.toString());
        // Default chunks for initLend in MIXED mode
        const c10 = Math.floor((initLend * 0.45) / 10000);
        const rem = initLend - (c10 * 10000);
        const c5 = Math.floor(rem / 5000);
        setCount10k(c10);
        setCount5k(c5);
        setMembers(membersRes);
      } catch (err) {
        setError(err.message || 'Failed to fetch cycle setup data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const numLending = parseFloat(lendingAmount) || 0;
  const numInterest = parseFloat(defaultInterest) || 500;
  const reserveAmount = Math.max(0, availableBalance - numLending);

  const totalConfiguredAmount = (count10k * 10000) + (count5k * 5000);
  const totalNumberOfChunks = count10k + count5k;
  const diffFromLending = numLending - totalConfiguredAmount;

  // Auto-calculate chunk split based on mode
  const autoCalculateChunks = (targetLending, mode = chunkMode) => {
    const lend = Math.max(0, targetLending);
    if (mode === 'ALL_5K') {
      return { c10: 0, c5: Math.floor(lend / 5000) };
    } else if (mode === 'ALL_10K') {
      const c10 = Math.floor(lend / 10000);
      const rem = lend - (c10 * 10000);
      const c5 = Math.floor(rem / 5000);
      return { c10, c5 };
    } else {
      // MIXED mode: balanced combination of 10k and 5k chunks
      const c10 = Math.floor((lend * 0.45) / 10000);
      const rem = lend - (c10 * 10000);
      const c5 = Math.floor(rem / 5000);
      return { c10, c5 };
    }
  };

  // Interactive Lending & Reserve Sync
  const handleLendingChange = (valStr) => {
    setLendingAmount(valStr);
    const val = parseFloat(valStr) || 0;
    if (val > 0) {
      const { c10, c5 } = autoCalculateChunks(val, chunkMode);
      setCount10k(c10);
      setCount5k(c5);
    }
  };

  const handleReserveChange = (valStr) => {
    const resVal = parseFloat(valStr) || 0;
    const targetLend = Math.max(0, availableBalance - resVal);
    const lendInChunks = Math.floor(targetLend / 5000) * 5000;
    setLendingAmount(lendInChunks.toString());
    const { c10, c5 } = autoCalculateChunks(lendInChunks, chunkMode);
    setCount10k(c10);
    setCount5k(c5);
  };

  const handleApplyPresetLending = (targetLend) => {
    const lend = Math.min(targetLend, availableBalance);
    setLendingAmount(lend.toString());
    const { c10, c5 } = autoCalculateChunks(lend, chunkMode);
    setCount10k(c10);
    setCount5k(c5);
  };

  const handleAutoBalanceChunks = () => {
    const { c10, c5 } = autoCalculateChunks(numLending, chunkMode);
    setCount10k(c10);
    setCount5k(c5);
  };

  // Presets
  const handleSetAll5k = () => {
    setChunkMode('ALL_5K');
    const { c10, c5 } = autoCalculateChunks(numLending, 'ALL_5K');
    setCount10k(c10);
    setCount5k(c5);
  };

  const handleSetAll10k = () => {
    setChunkMode('ALL_10K');
    const { c10, c5 } = autoCalculateChunks(numLending, 'ALL_10K');
    setCount10k(c10);
    setCount5k(c5);
  };

  const handleSetMixed = () => {
    setChunkMode('MIXED');
    const { c10, c5 } = autoCalculateChunks(numLending, 'MIXED');
    setCount10k(c10);
    setCount5k(c5);
  };

  // Step 2 -> Step 3 transition: prepare chunk list
  const handleProceedToAllocation = () => {
    if (numLending > availableBalance) {
      setError(`Lending amount (${formatRupees(numLending)}) cannot exceed available group balance (${formatRupees(availableBalance)}).`);
      return;
    }
    if (numLending <= 0) {
      setError('Lending amount must be greater than zero.');
      return;
    }
    if (numLending % 5000 !== 0) {
      setError(`Lending amount (${formatRupees(numLending)}) must be a multiple of ₹5,000 to match chunk denominations. Any leftover funds remain in reserve.`);
      return;
    }
    if (totalNumberOfChunks <= 0) {
      setError('Please configure at least one chunk (either ₹10,000 or ₹5,000).');
      return;
    }
    if (totalConfiguredAmount !== numLending) {
      setError(`Total configured chunks (${formatRupees(totalConfiguredAmount)}) must equal the lending amount (${formatRupees(numLending)}). Click "Auto-Balance" or adjust chunk counters.`);
      return;
    }

    setError(null);

    // Build mixed chunks list: 10k chunks first, then 5k chunks
    const newAssignments = [];
    let chunkNum = 1;

    for (let i = 0; i < count10k; i++) {
      const existing = chunkAssignments.find(c => c.chunkNumber === chunkNum);
      const defaultMember = members[chunkNum - 1]?.id || (members[0]?.id || '');
      newAssignments.push({
        chunkNumber: chunkNum,
        memberId: existing ? existing.memberId : defaultMember,
        principalAmount: 10000,
        denomination: 10000,
        interestAmount: existing ? existing.interestAmount : (numInterest * 2),
        dueDate: existing ? existing.dueDate : endDate,
        notes: existing ? existing.notes : `₹10,000 Chunk #${chunkNum}`
      });
      chunkNum++;
    }

    for (let i = 0; i < count5k; i++) {
      const existing = chunkAssignments.find(c => c.chunkNumber === chunkNum);
      const defaultMember = members[chunkNum - 1]?.id || (members[0]?.id || '');
      newAssignments.push({
        chunkNumber: chunkNum,
        memberId: existing ? existing.memberId : defaultMember,
        principalAmount: 5000,
        denomination: 5000,
        interestAmount: existing ? existing.interestAmount : numInterest,
        dueDate: existing ? existing.dueDate : endDate,
        notes: existing ? existing.notes : `₹5,000 Chunk #${chunkNum}`
      });
      chunkNum++;
    }

    setChunkAssignments(newAssignments);
    setStep(3);
  };

  const handleUpdateChunk = (chunkIndex, field, value) => {
    const updated = [...chunkAssignments];
    updated[chunkIndex] = {
      ...updated[chunkIndex],
      [field]: value
    };
    setChunkAssignments(updated);
  };

  const handleFinalSubmit = async () => {
    // Validate that members are selected and all distinct
    const selectedMemberIds = new Set();
    for (const chunk of chunkAssignments) {
      if (!chunk.memberId) {
        setError(`Please select an auction winning member for Chunk #${chunk.chunkNumber}`);
        return;
      }
      if (selectedMemberIds.has(chunk.memberId)) {
        const dupMember = members.find(m => String(m.id) === String(chunk.memberId));
        setError(`Member '${dupMember?.name || chunk.memberId}' is selected for multiple chunks. Under village rules, one person cannot take more than one chunk in a single month.`);
        return;
      }
      selectedMemberIds.add(chunk.memberId);
    }

    setSubmitting(true);
    setError(null);

    try {
      const breakdownText = `${count10k}x ₹10,000 + ${count5k}x ₹5,000`;
      // 1. Create cycle
      const cycleRes = await api.createCycle({
        cycleName: cycleName.trim(),
        monthDate: startDate,
        startDate,
        endDate,
        lendingAmount: numLending,
        chunkAmount: 5000,
        numberOfChunks: totalNumberOfChunks,
        chunkBreakdown: breakdownText,
        notes: notes.trim() || undefined
      });

      // 2. Assign chunks
      await api.assignChunks(cycleRes.id, chunkAssignments.map(c => ({
        chunkNumber: c.chunkNumber,
        memberId: parseInt(c.memberId),
        principalAmount: parseFloat(c.principalAmount),
        interestAmount: parseFloat(c.interestAmount),
        dueDate: c.dueDate,
        notes: c.notes
      })));

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to start monthly cycle');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '2rem', textAlign: 'center' }}>
          Loading cycle setup...
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Start New Month (Rotating Cycle)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Step {step} of 3: {step === 1 ? 'Month & Dates' : step === 2 ? 'Lending & Reserve Split' : 'Assign Chunks to Members'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div style={{ padding: '1rem 1.5rem 0' }}>
          <div className="wizard-steps">
            <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
              <div className="wizard-step-circle">1</div>
              <span>Month Info</span>
            </div>
            <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
              <div className="wizard-step-circle">2</div>
              <span>Lending & Reserve</span>
            </div>
            <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
              <div className="wizard-step-circle">3</div>
              <span>Assign Chunks</span>
            </div>
          </div>
        </div>

        <div className="modal-body" style={{ paddingTop: '0.5rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label" htmlFor="cycle-name">
                  Month / Cycle Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="cycle-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. October 2026"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="start-date">
                    Cycle Start Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="end-date">
                    Default Due / End Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cycle-notes">
                  Cycle Notes (Optional)
                </label>
                <textarea
                  id="cycle-notes"
                  className="form-control"
                  rows={2}
                  placeholder="Special notes or festival considerations for this month..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Financial Decision - Lending Amount, Reserve, and Chunks */}
          {step === 2 && (
            <div>
              {/* Core Principle Alert */}
              <div className="alert alert-info">
                <Info size={20} />
                <div>
                  <strong>The Leader Decides:</strong> Total Group Balance is{' '}
                  <strong>{formatRupees(availableBalance)}</strong>. Decide how much money to disburse as auction loan chunks and how much to retain in reserve.
                </div>
              </div>

              {/* Quick Preset Buttons for Lending / Reserve */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  ⚡ Quick Decision Presets:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Math.floor(availableBalance / 5000) * 5000 > 0 && (
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLending(Math.floor(availableBalance / 5000) * 5000)}
                      className={`btn btn-sm ${numLending === Math.floor(availableBalance / 5000) * 5000 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      Max Lend ({formatRupees(Math.floor(availableBalance / 5000) * 5000)})
                    </button>
                  )}
                  {availableBalance >= 60000 && (
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLending(60000)}
                      className={`btn btn-sm ${numLending === 60000 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      Lend ₹60k (Reserve {formatRupees(availableBalance - 60000)})
                    </button>
                  )}
                  {availableBalance >= 50000 && (
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLending(50000)}
                      className={`btn btn-sm ${numLending === 50000 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      Lend ₹50k (Reserve {formatRupees(availableBalance - 50000)})
                    </button>
                  )}
                  {availableBalance > 25000 && (
                    <button
                      type="button"
                      onClick={() => handleApplyPresetLending(Math.floor((availableBalance * 0.8) / 5000) * 5000)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      80% Lending / 20% Reserve
                    </button>
                  )}
                </div>
              </div>

              {/* Two-Way Interactive Lending & Reserve Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* Lending Pool Input */}
                  <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                    <label className="form-label" htmlFor="lending-amount" style={{ color: '#1d4ed8', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔷 Amount to Lend (₹)</span>
                      <span className="currency" style={{ fontSize: '1.1rem' }}>{formatRupees(numLending)}</span>
                    </label>
                    <input
                      id="lending-amount"
                      type="number"
                      step="5000"
                      min="5000"
                      max={availableBalance}
                      className="form-control"
                      style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: '#ffffff' }}
                      value={lendingAmount}
                      onChange={(e) => handleLendingChange(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.35rem' }}>
                      Disbursed to members as auction chunks (multiples of ₹5,000)
                    </div>
                  </div>

                  {/* Reserve Pool Input */}
                  <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                    <label className="form-label" htmlFor="reserve-amount" style={{ color: '#b45309', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔶 Reserve Retained (₹)</span>
                      <span className="currency" style={{ fontSize: '1.1rem' }}>{formatRupees(reserveAmount)}</span>
                    </label>
                    <input
                      id="reserve-amount"
                      type="number"
                      step="1000"
                      min="0"
                      max={availableBalance}
                      className="form-control"
                      style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: '#ffffff' }}
                      value={reserveAmount}
                      onChange={(e) => handleReserveChange(e.target.value)}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.35rem' }}>
                      Safety buffer & liquid village savings left in bank
                    </div>
                  </div>
                </div>

                {/* Split Visual Progress Bar */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Lending: {availableBalance > 0 ? ((numLending / availableBalance) * 100).toFixed(0) : 0}%</span>
                    <span>Total Pool: {formatRupees(availableBalance)}</span>
                    <span>Reserve: {availableBalance > 0 ? ((reserveAmount / availableBalance) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, (numLending / (availableBalance || 1)) * 100))}%`,
                        background: '#3b82f6',
                        transition: 'width 0.3s ease'
                      }}
                    />
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, (reserveAmount / (availableBalance || 1)) * 100))}%`,
                        background: '#f59e0b',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Warning if Lending is not a multiple of 5000 */}
              {numLending % 5000 !== 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} />
                    <span>Lending amount must be a multiple of ₹5,000 for ₹10k and ₹5k chunks.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLendingChange(String(Math.floor(numLending / 5000) * 5000))}
                    className="btn btn-sm btn-secondary"
                  >
                    Round to {formatRupees(Math.floor(numLending / 5000) * 5000)}
                  </button>
                </div>
              )}

              {/* Flexible Chunk Composition: Combination of 10k and 5k Chunks */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                    Chunk Composition (Select 10k & 5k Mix) <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  {/* Preset buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={handleSetMixed}
                      className={`btn ${chunkMode === 'MIXED' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      Mixed (10k & 5k)
                    </button>
                    <button
                      type="button"
                      onClick={handleSetAll5k}
                      className={`btn ${chunkMode === 'ALL_5K' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      All 5k
                    </button>
                    <button
                      type="button"
                      onClick={handleSetAll10k}
                      className={`btn ${chunkMode === 'ALL_10K' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      All 10k
                    </button>
                  </div>
                </div>

                {/* 10k and 5k Counter Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* ₹10,000 Chunks */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.9rem' }}>
                        🔷 ₹10,000 Chunks
                      </span>
                      <span className="currency" style={{ fontWeight: 700, color: '#1d4ed8' }}>
                        {formatRupees(count10k * 10000)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setCount10k(Math.max(0, count10k - 1))}
                        className="btn btn-secondary"
                        style={{ width: '36px', height: '36px', padding: 0, fontWeight: 800, fontSize: '1.2rem' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count10k}
                        onChange={(e) => setCount10k(Math.max(0, parseInt(e.target.value) || 0))}
                        className="form-control"
                        style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setCount10k(count10k + 1)}
                        className="btn btn-secondary"
                        style={{ width: '36px', height: '36px', padding: 0, fontWeight: 800, fontSize: '1.2rem' }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
                      {count10k} chunk{count10k !== 1 ? 's' : ''} of ₹10,000
                    </div>
                  </div>

                  {/* ₹5,000 Chunks */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #fde68a',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#b45309', fontSize: '0.9rem' }}>
                        🔶 ₹5,000 Chunks
                      </span>
                      <span className="currency" style={{ fontWeight: 700, color: '#b45309' }}>
                        {formatRupees(count5k * 5000)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setCount5k(Math.max(0, count5k - 1))}
                        className="btn btn-secondary"
                        style={{ width: '36px', height: '36px', padding: 0, fontWeight: 800, fontSize: '1.2rem' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count5k}
                        onChange={(e) => setCount5k(Math.max(0, parseInt(e.target.value) || 0))}
                        className="form-control"
                        style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setCount5k(count5k + 1)}
                        className="btn btn-secondary"
                        style={{ width: '36px', height: '36px', padding: 0, fontWeight: 800, fontSize: '1.2rem' }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
                      {count5k} chunk{count5k !== 1 ? 's' : ''} of ₹5,000
                    </div>
                  </div>
                </div>

                {/* Real-time Allocation Match Summary */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: diffFromLending === 0 ? '#86efac' : diffFromLending > 0 ? '#fde68a' : '#fca5a5',
                    background: diffFromLending === 0 ? '#f0fdf4' : diffFromLending > 0 ? '#fffbeb' : '#fef2f2',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: diffFromLending === 0 ? '#15803d' : diffFromLending > 0 ? '#b45309' : '#b91c1c' }}>
                      {diffFromLending === 0
                        ? `✅ Perfect Allocation: ${totalNumberOfChunks} chunks totaling ${formatRupees(totalConfiguredAmount)} match lending target.`
                        : diffFromLending > 0
                        ? `⚠️ ${formatRupees(diffFromLending)} remaining unallocated.`
                        : `❌ Exceeds lending target by ${formatRupees(Math.abs(diffFromLending))}.`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total Configured: <strong>{totalNumberOfChunks} chunks</strong> &bull; ({count10k} × ₹10k + {count5k} × ₹5k)
                    </div>
                  </div>

                  {/* Auto-balance and quick-adjust buttons */}
                  {diffFromLending !== 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleAutoBalanceChunks}
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#0284c7', borderColor: '#0284c7' }}
                      >
                        ⚡ Auto-Match Chunks
                      </button>
                      {diffFromLending >= 10000 && (
                        <button
                          type="button"
                          onClick={() => setCount10k(count10k + Math.floor(diffFromLending / 10000))}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          + Add {Math.floor(diffFromLending / 10000)}x 10k
                        </button>
                      )}
                      {diffFromLending >= 5000 && (
                        <button
                          type="button"
                          onClick={() => setCount5k(count5k + Math.floor(diffFromLending / 5000))}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          + Add {Math.floor(diffFromLending / 5000)}x 5k
                        </button>
                      )}
                      {diffFromLending < 0 && count10k > 0 && Math.abs(diffFromLending) >= 10000 && (
                        <button
                          type="button"
                          onClick={() => setCount10k(count10k - 1)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          - Remove 1x 10k
                        </button>
                      )}
                      {diffFromLending < 0 && count5k > 0 && Math.abs(diffFromLending) >= 5000 && (
                        <button
                          type="button"
                          onClick={() => setCount5k(count5k - 1)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          - Remove 1x 5k
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Default Baseline Interest */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="default-interest">
                  Baseline Interest for 5k Chunk (₹)
                </label>
                <input
                  id="default-interest"
                  type="number"
                  step="50"
                  className="form-control"
                  value={defaultInterest}
                  onChange={(e) => setDefaultInterest(e.target.value)}
                  style={{ maxWidth: '240px' }}
                />
                <div className="form-hint">
                  10k chunks will automatically scale to ₹{numInterest * 2}. Each winning member&apos;s exact auction bid will be set in the next step.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Assign Chunks to Members via Auction Bidding */}
          {step === 3 && (
            <div>
              {/* Auction Rule & Guidance Banner */}
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                <Info size={20} />
                <div>
                  <strong>Auction Bidding System:</strong> Once the pool is collected, members bid in an auction for each chunk. The winning member&apos;s bid decides the monthly interest amount.
                  <div style={{ fontWeight: 700, color: '#991b1b', marginTop: '0.25rem' }}>
                    ⚠️ Strict Village Rule: One person CANNOT take more than one chunk of loan in a single month.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Disbursing <strong>{totalNumberOfChunks} Chunks</strong> ({count10k > 0 ? `${count10k}x ₹10k` : ''}{count10k > 0 && count5k > 0 ? ' + ' : ''}{count5k > 0 ? `${count5k}x ₹5k` : ''}) &bull; Total Principal: <strong className="currency" style={{ color: 'var(--primary-700)' }}>{formatRupees(totalConfiguredAmount)}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontWeight: 600 }}>
                  Active Village Members: {members.length} &bull; Chunks: {totalNumberOfChunks}
                </div>
              </div>

              <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Chunk</th>
                      <th>Auction Winning Member (1 Max/Month)</th>
                      <th>Principal</th>
                      <th>Winning Interest Bid (₹)</th>
                      <th>Total Repayment Due</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunkAssignments.map((chunk, index) => {
                      const principal = parseFloat(chunk.principalAmount) || 0;
                      const interest = parseFloat(chunk.interestAmount) || 0;
                      const totalDue = principal + interest;

                      return (
                        <tr key={chunk.chunkNumber}>
                          <td style={{ fontWeight: 700, textAlign: 'center', color: 'var(--primary-900)' }}>
                            #{chunk.chunkNumber}
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem', fontWeight: 600 }}
                              value={chunk.memberId}
                              onChange={(e) => handleUpdateChunk(index, 'memberId', e.target.value)}
                              required
                            >
                              <option value="">Select Winning Bidder...</option>
                              {members.map(m => {
                                // Check if this member is assigned to ANOTHER chunk
                                const otherChunk = chunkAssignments.find((c, i) => i !== index && String(c.memberId) === String(m.id));
                                const isAssignedElsewhere = Boolean(otherChunk);

                                return (
                                  <option
                                    key={m.id}
                                    value={m.id}
                                    disabled={isAssignedElsewhere}
                                  >
                                    {m.name} ({m.phone}) {isAssignedElsewhere ? `— [Already in Chunk #${otherChunk.chunkNumber}]` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                background: principal >= 10000 ? '#eff6ff' : '#fef3c7',
                                color: principal >= 10000 ? '#1d4ed8' : '#b45309',
                                border: `1px solid ${principal >= 10000 ? '#bfdbfe' : '#fde68a'}`
                              }}
                            >
                              {principal >= 10000 ? '🔷 ' : '🔶 '}
                              {formatRupees(principal)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>₹</span>
                              <input
                                type="number"
                                step="25"
                                min="0"
                                className="form-control"
                                style={{ width: '90px', padding: '0.35rem 0.5rem', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                                value={chunk.interestAmount}
                                onChange={(e) => handleUpdateChunk(index, 'interestAmount', e.target.value)}
                                title="Interest amount decided in the chunk auction"
                              />
                            </div>
                          </td>
                          <td className="currency" style={{ fontWeight: 800, color: 'var(--primary-800)' }}>
                            {formatRupees(totalDue)}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              (₹{principal} + ₹{interest})
                            </div>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                              value={chunk.dueDate}
                              onChange={(e) => handleUpdateChunk(index, 'dueDate', e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>

          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                if (!cycleName.trim()) {
                  setError('Cycle name is required.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="btn btn-primary"
            >
              <span>Next: Decide Lending & Reserve</span> <ArrowRight size={16} />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleProceedToAllocation}
              className="btn btn-primary"
            >
              <span>Next: Assign {totalNumberOfChunks} Chunks</span> <ArrowRight size={16} />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              <CheckCircle size={18} />
              <span>{submitting ? 'Starting Cycle...' : 'Start Month & Disburse Chunks'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
