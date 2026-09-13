import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Check, Slash } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  switch (status.toUpperCase()) {
    case 'PAID':
      return (
        <span className="status-pill paid">
          <CheckCircle2 size={13} /> Paid
        </span>
      );
    case 'PARTIALLY_PAID':
    case 'PARTIAL':
      return (
        <span className="status-pill partial">
          <Clock size={13} /> Partial
        </span>
      );
    case 'PENDING':
      return (
        <span className="status-pill pending">
          <Clock size={13} /> Pending
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="status-pill overdue">
          <AlertTriangle size={13} /> Overdue
        </span>
      );
    case 'OPEN':
      return (
        <span className="status-pill open">
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }}></span>
          OPEN
        </span>
      );
    case 'CLOSED':
      return (
        <span className="status-pill closed">
          <Check size={13} /> CLOSED
        </span>
      );
    case 'ACTIVE':
      return (
        <span className="status-pill paid" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
          Active
        </span>
      );
    case 'INACTIVE':
      return (
        <span className="status-pill closed" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
          Inactive
        </span>
      );
    default:
      return <span className="status-pill closed">{status}</span>;
  }
}
