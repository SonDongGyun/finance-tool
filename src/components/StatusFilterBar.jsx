import { COLORS } from '../constants/colors';

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'removed', label: '제거' },
  { key: 'increased', label: '증가' },
  { key: 'decreased', label: '감소' },
];

// Used by DetailTable (default size) and VendorTable (compact size).
// counts: { new, removed, increased, decreased } — pre-computed by parent so
// this component stays free of result-shape knowledge.
export default function StatusFilterBar({
  value,
  onChange,
  counts,
  size = 'default',
  marginBottom = 24,
}) {
  const isCompact = size === 'compact';
  const padding = isCompact ? '6px 14px' : '8px 16px';
  const fontSize = isCompact ? '12px' : '13px';
  const countFontSize = isCompact ? '11px' : '12px';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: `${marginBottom}px` }}>
      {FILTERS.map(f => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              padding,
              fontSize,
              borderRadius: '8px',
              fontWeight: 600,
              border: active ? '1px solid rgba(96,165,250,0.4)' : `1px solid ${COLORS.borderLight}`,
              background: active ? 'rgba(59,130,246,0.15)' : 'rgba(15,23,42,0.4)',
              color: active ? COLORS.blue : COLORS.sub,
              cursor: 'pointer',
            }}
          >
            {f.label}
            {f.key !== 'all' && counts && (
              <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: countFontSize }}>
                {counts[f.key] ?? 0}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
