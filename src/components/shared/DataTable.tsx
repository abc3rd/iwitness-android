// Reusable Data Table Component
import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns, data, onRowClick, emptyMessage = 'No data found.',
}: DataTableProps<T>) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', padding: '8px 12px', background: '#0f172a',
        borderBottom: '1px solid #1e293b', gap: 8,
      }}>
        {columns.map(col => (
          <div key={col.key} style={{
            flex: col.width ? `0 0 ${col.width}` : 1,
            fontSize: 10, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase',
          }}>
            {col.header}
          </div>
        ))}
      </div>

      {/* Rows */}
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', fontSize: 12, opacity: 0.5 }}>
          {emptyMessage}
        </div>
      ) : (
        data.map((row, i) => (
          <div
            key={i}
            onClick={() => onRowClick?.(row)}
            style={{
              display: 'flex', padding: '10px 12px', gap: 8,
              borderBottom: i < data.length - 1 ? '1px solid #0f172a' : 'none',
              background: '#020617',
              cursor: onRowClick ? 'pointer' : 'default',
            }}
          >
            {columns.map(col => (
              <div key={col.key} style={{
                flex: col.width ? `0 0 ${col.width}` : 1,
                fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {col.render ? col.render(row) : String(row[col.key] ?? '')}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
