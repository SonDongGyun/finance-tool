import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { formatMonthLabel } from '../utils/formatters';
import { GRADIENTS } from '../constants/colors';

const selectStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  background: 'rgba(30,41,59,0.8)',
  border: '1px solid rgba(100,116,139,0.3)',
  color: '#e2e8f0',
  fontSize: '15px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
};

const smallSelectStyle = { ...selectStyle, padding: '10px 12px', fontSize: '14px' };

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        background: active ? GRADIENTS.primary : 'transparent',
        color: active ? 'white' : '#94a3b8',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function RangePicker({ title, range, onChange, months }) {
  const startIdx = range.start ? months.indexOf(range.start) : -1;
  const endIdx = range.end ? months.indexOf(range.end) : -1;

  // Auto-correct rather than silently swap (which masks user intent):
  // tightening the other endpoint when the user picks an out-of-order value.
  const handleStartChange = (value) => {
    const next = { ...range, start: value };
    if (value && range.end && months.indexOf(value) > months.indexOf(range.end)) {
      next.end = value;
    }
    onChange(next);
  };
  const handleEndChange = (value) => {
    const next = { ...range, end: value };
    if (value && range.start && months.indexOf(value) < months.indexOf(range.start)) {
      next.start = value;
    }
    onChange(next);
  };

  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
        {title}
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={range.start}
          onChange={(e) => handleStartChange(e.target.value)}
          style={smallSelectStyle}
        >
          <option value="">시작월</option>
          {months.map((m, i) => (
            <option key={m} value={m} disabled={endIdx >= 0 && i > endIdx}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
        <span style={{ color: '#64748b', fontSize: '13px' }}>~</span>
        <select
          value={range.end}
          onChange={(e) => handleEndChange(e.target.value)}
          style={smallSelectStyle}
        >
          <option value="">종료월</option>
          {months.map((m, i) => (
            <option key={m} value={m} disabled={startIdx >= 0 && i < startIdx}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function MonthSelector({
  months,
  mode,
  onModeChange,
  range1,
  range2,
  onRange1Change,
  onRange2Change,
  onAnalyze,
}) {
  const r1Ok = range1.start && range1.end;
  const r2Ok = range2.start && range2.end;
  const sameRange = range1.start === range2.start && range1.end === range2.end;
  const canAnalyze = r1Ok && r2Ok && !sameRange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', marginTop: '32px' }}
    >
      <div className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Calendar style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>비교 기간 선택</h3>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: 'rgba(15,23,42,0.6)',
            borderRadius: '10px',
            marginBottom: '24px',
          }}
        >
          <ToggleButton active={mode === 'single'} onClick={() => onModeChange('single')}>
            단일월 비교
          </ToggleButton>
          <ToggleButton active={mode === 'range'} onClick={() => onModeChange('range')}>
            기간 비교
          </ToggleButton>
        </div>

        {mode === 'single' ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
                기준월 (이전)
              </label>
              <select
                value={range1.start}
                onChange={(e) => onRange1Change({ start: e.target.value, end: e.target.value })}
                style={selectStyle}
              >
                <option value="">월 선택</option>
                {months.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
              </select>
            </div>

            <div style={{ paddingBottom: '8px' }}>
              <ArrowRight style={{ width: '24px', height: '24px', color: '#a78bfa' }} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
                비교월 (이후)
              </label>
              <select
                value={range2.start}
                onChange={(e) => onRange2Change({ start: e.target.value, end: e.target.value })}
                style={selectStyle}
              >
                <option value="">월 선택</option>
                {months.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <RangePicker title="기준 기간 (이전)" range={range1} onChange={onRange1Change} months={months} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowRight style={{ width: '22px', height: '22px', color: '#a78bfa' }} />
            </div>
            <RangePicker title="비교 기간 (이후)" range={range2} onChange={onRange2Change} months={months} />
          </div>
        )}

        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          style={{
            marginTop: '28px',
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: canAnalyze ? 'pointer' : 'not-allowed',
            background: canAnalyze
              ? GRADIENTS.primary
              : 'rgba(51,65,85,0.4)',
            color: canAnalyze ? 'white' : '#64748b',
          }}
        >
          {canAnalyze
            ? '분석 시작'
            : mode === 'single'
              ? '두 달을 모두 선택해주세요'
              : '두 기간을 모두 선택해주세요'}
        </button>
      </div>
    </motion.div>
  );
}
