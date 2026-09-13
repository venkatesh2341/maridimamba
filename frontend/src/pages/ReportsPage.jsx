import React, { useState, useEffect } from 'react';
import { api, formatRupees, formatDate } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { FileSpreadsheet, Download, Printer, Calendar } from 'lucide-react';

export default function ReportsPage({ initialCycleId }) {
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(initialCycleId || null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const res = await api.getCycles();
        setCycles(res);
        if (!selectedCycleId && res.length > 0) {
          setSelectedCycleId(res[0].id);
        }
      } catch (err) {
        console.error('Error fetching cycles for report:', err);
      }
    };
    fetchCycles();
  }, []);

  useEffect(() => {
    if (!selectedCycleId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.getMonthlyReport(selectedCycleId);
        setReport(res);
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedCycleId]);

  const handleDownloadCsv = () => {
    if (!selectedCycleId) return;
    window.open(`/api/reports/monthly/${selectedCycleId}/export`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Monthly Financial Reports</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive statements of group pools, interest distributions, and exportable ledgers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: '220px', fontWeight: 600 }}
            value={selectedCycleId || ''}
            onChange={(e) => setSelectedCycleId(e.target.value)}
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cycleName} ({c.status})
              </option>
            ))}
          </select>

          <button onClick={handleDownloadCsv} className="btn btn-secondary" title="Export as CSV/Excel">
            <Download size={16} /> Export CSV
          </button>

          <button onClick={handlePrint} className="btn btn-secondary" title="Print statement">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading financial report...
        </div>
      )}

      {report && !loading && (
        <div id="printable-report">
          {/* Statement Header Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Monthly Group Statement
                </span>
                <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', marginTop: '0.25rem' }}>
                  {report.cycleName}
                </h3>
                <div style={{ marginTop: '0.35rem' }}>
                  <StatusBadge status={report.status} />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Closing Balance
                </div>
                <div className="currency" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  {formatRupees(report.closingBalance || (report.reserveAmount + report.totalAmountCollected))}
                </div>
              </div>
            </div>

            {/* Reconciliation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Opening Balance</div>
                <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{formatRupees(report.openingBalance)}</div>
              </div>

              <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#0369a1', fontWeight: 600 }}>Amount Lent</div>
                <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0369a1', marginTop: '0.25rem' }}>{formatRupees(report.amountLent)}</div>
              </div>

              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#92400e', fontWeight: 600 }}>Reserve Retained</div>
                <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem' }}>{formatRupees(report.reserveAmount)}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Expected Total</div>
                <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{formatRupees(report.expectedTotal)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  (₹{report.expectedPrincipal} + ₹{report.expectedInterest} int.)
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-800)', fontWeight: 600 }}>Actual Total Collected</div>
                <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-700)', marginTop: '0.25rem' }}>{formatRupees(report.totalAmountCollected)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary-700)' }}>
                  (₹{report.actualPrincipalCollected} prin. + ₹{report.actualInterestCollected} int.)
                </div>
              </div>

              <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#991b1b', fontWeight: 600 }}>Outstanding Balance</div>
                <div className="currency" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>{formatRupees(report.outstandingAmount)}</div>
              </div>
            </div>
          </div>

          {/* Member-by-Member Breakdown Table */}
          <div className="card-table-container">
            <div className="card-header">
              <h3 className="card-title">Member-by-Member Loan & Repayment Roster</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Total {report.memberLoans?.length} chunk allocations
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Chunk</th>
                    <th>Borrower Name</th>
                    <th>Phone</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total Due</th>
                    <th>Amount Paid</th>
                    <th>Remaining</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.memberLoans?.map((m) => (
                    <tr key={m.loanId}>
                      <td style={{ fontWeight: 700, textAlign: 'center' }}>#{m.chunkNumber}</td>
                      <td><strong>{m.memberName}</strong></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{m.memberPhone}</td>
                      <td className="currency">{formatRupees(m.principalAmount)}</td>
                      <td className="currency">{formatRupees(m.interestAmount)}</td>
                      <td className="currency" style={{ fontWeight: 700 }}>{formatRupees(m.totalDue)}</td>
                      <td className="currency" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{formatRupees(m.amountPaid)}</td>
                      <td className="currency" style={{ color: m.remainingAmount > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: 700 }}>
                        {formatRupees(m.remainingAmount)}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{formatDate(m.dueDate)}</td>
                      <td><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
