// Reusable Card Component
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  style?: CSSProperties;
  padding?: number;
}

export default function Card({ children, title, subtitle, style, padding = 16 }: CardProps) {
  return (
    <div style={{
      borderRadius: 12, border: '1px solid #1e293b',
      padding, background: '#020617', ...style,
    }}>
      {title && (
        <div style={{ marginBottom: subtitle ? 2 : 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.5 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
