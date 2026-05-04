import { Plus, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { STATUS_COLORS } from '../constants/colors';

const META = {
  new:       { label: '신규', Icon: Plus },
  removed:   { label: '제거', Icon: Minus },
  increased: { label: '증가', Icon: ArrowUpRight },
  decreased: { label: '감소', Icon: ArrowDownRight },
  unchanged: { label: '동일', Icon: null },
};

// "default" variant ships with an icon + border (DetailTable header column);
// "compact" is the borderless pill VendorTable uses inside dense rows.
export default function StatusBadge({ status, variant = 'default' }) {
  const c = STATUS_COLORS[status];
  const m = META[status];
  if (!c || !m) return null;

  if (variant === 'compact') {
    return (
      <span style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
      }}>
        {m.label}
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      color: c.fg,
      background: c.bg,
      border: `1px solid ${c.border}`,
    }}>
      {m.Icon && <m.Icon style={{ width: '12px', height: '12px' }} />}
      {m.label}
    </span>
  );
}
