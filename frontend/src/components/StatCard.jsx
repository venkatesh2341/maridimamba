import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, theme = 'emerald' }) {
  const themeColors = {
    emerald: { bg: '#ecfdf5', iconColor: '#059669' },
    amber: { bg: '#fef3c7', iconColor: '#d97706' },
    blue: { bg: '#e0f2fe', iconColor: '#0284c7' },
    purple: { bg: '#f3e8ff', iconColor: '#7c3aed' },
  };

  const selectedTheme = themeColors[theme] || themeColors.emerald;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div
            className="stat-card-icon"
            style={{ backgroundColor: selectedTheme.bg, color: selectedTheme.iconColor }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
      <div>
        <div className="stat-card-value currency">{value}</div>
        {subtext && <div className="stat-card-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
