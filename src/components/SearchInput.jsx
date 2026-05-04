import { Search, X } from 'lucide-react';
import { COLORS } from '../constants/colors';

// Reused by DetailTable and VendorTable. Press-Enter-to-apply pattern with
// an "active" highlight + clear button while a term is committed.
export default function SearchInput({
  value,
  onChange,
  onSubmit,
  term,
  onClear,
  placeholder,
  ariaLabel,
  width = 260,
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Search style={{
        width: '16px', height: '16px',
        position: 'absolute', left: '12px', top: '50%',
        transform: 'translateY(-50%)', color: COLORS.dim,
      }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={{
          paddingLeft: '36px',
          paddingRight: term ? '36px' : '16px',
          paddingTop: '10px',
          paddingBottom: '10px',
          borderRadius: '8px',
          background: COLORS.surface,
          border: term ? '1px solid rgba(96,165,250,0.4)' : `1px solid ${COLORS.border}`,
          fontSize: '14px',
          color: COLORS.text,
          outline: 'none',
          width: `${width}px`,
        }}
      />
      {term && (
        <button
          onClick={onClear}
          aria-label="검색어 지우기"
          style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(100,116,139,0.3)', border: 'none', borderRadius: '50%',
            width: '20px', height: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}
        >
          <X style={{ width: '12px', height: '12px', color: COLORS.mute }} />
        </button>
      )}
    </div>
  );
}
