// Reusable Status Badge Component

const defaultColors: Record<string, string> = {
  active: '#22c55e', new: '#3b82f6', contacted: '#8b5cf6',
  qualified: '#f59e0b', proposal: '#ef4444', negotiation: '#ea00ea',
  won: '#22c55e', lost: '#64748b', closed: '#64748b',
  intake: '#3b82f6', review: '#f59e0b', pending: '#f59e0b',
  in_litigation: '#ef4444', settlement: '#4bce2a', archived: '#475569',
  draft: '#6b7280', paused: '#f59e0b', expired: '#64748b',
  high: '#ef4444', medium: '#f59e0b', low: '#22c55e',
};

interface StatusBadgeProps {
  status: string;
  color?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, color, size = 'sm' }: StatusBadgeProps) {
  const c = color || defaultColors[status.toLowerCase()] || '#94a3b8';
  const fontSize = size === 'sm' ? 10 : 12;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';

  return (
    <span style={{
      fontSize, padding, borderRadius: 999,
      border: `1px solid ${c}`, color: c,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
