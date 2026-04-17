import { motion } from 'framer-motion';
import { Layers, ArrowRight, AlertTriangle } from 'lucide-react';

const selectStyle = {
  padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(30,41,59,0.8)',
  border: '1px solid rgba(100,116,139,0.3)',
  color: '#e2e8f0',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
};

function monthNum(monthKey) {
  return Number(monthKey.split('-')[1]);
}

function MonthChips({ months, checked, onToggle }) {
  if (months.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>
        이 시트에서 날짜 데이터를 찾지 못했어요.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {months.map(m => {
        const isOn = checked.has(m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => onToggle(m)}
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 600,
              border: isOn ? '1px solid rgba(96,165,250,0.6)' : '1px solid rgba(100,116,139,0.3)',
              cursor: 'pointer',
              background: isOn
                ? 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(139,92,246,0.35))'
                : 'rgba(30,41,59,0.6)',
              color: isOn ? '#e0e7ff' : '#cbd5e1',
              transition: 'all 0.15s',
            }}
          >
            {isOn ? '✓ ' : ''}{monthNum(m)}월
          </button>
        );
      })}
    </div>
  );
}

function SideCard({ title, sheets, selectedName, checkedMonths, onSheetChange, onToggleMonth, onSelectAll, onClearAll, disabledSheetName }) {
  const sheet = sheets.find(s => s.name === selectedName);
  const months = sheet?.months || [];
  const checkedCount = checkedMonths.size;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}>
            {title}
          </div>
          {sheets.length > 1 ? (
            <select
              value={selectedName}
              onChange={(e) => onSheetChange(e.target.value)}
              style={selectStyle}
            >
              {sheets.map(s => (
                <option
                  key={s.name}
                  value={s.name}
                  disabled={s.name === disabledSheetName}
                >
                  {s.label}{s.name !== s.label ? ` (${s.name})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>
              {sheet?.label || selectedName}
            </div>
          )}
        </div>

        {months.length > 0 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={onSelectAll}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                border: '1px solid rgba(100,116,139,0.3)',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              전체선택
            </button>
            <button
              type="button"
              onClick={onClearAll}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                border: '1px solid rgba(100,116,139,0.3)',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              초기화
            </button>
          </div>
        )}
      </div>

      <MonthChips months={months} checked={checkedMonths} onToggle={onToggleMonth} />

      <div style={{ fontSize: '12px', color: '#64748b' }}>
        {checkedCount > 0 ? `${checkedCount}개월 선택됨` : '비교할 월을 체크해주세요'}
      </div>
    </div>
  );
}

export default function SheetComparator({ sheets, side1, side2, onSide1Change, onSide2Change, onAnalyze }) {
  if (sheets.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', marginTop: '32px' }}
      >
        <div className="glass" style={{ borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <AlertTriangle style={{ width: '32px', height: '32px', color: '#f59e0b', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
            시트별 비교에는 시트 2개 이상이 필요합니다
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
            업로드한 파일은 시트가 {sheets.length}개입니다. 다른 파일을 업로드하거나 월별 비교 모드를 이용해주세요.
          </p>
        </div>
      </motion.div>
    );
  }

  const toggleMonth = (side, onChange) => (monthKey) => {
    const next = new Set(side.checkedMonths);
    if (next.has(monthKey)) next.delete(monthKey);
    else next.add(monthKey);
    onChange({ ...side, checkedMonths: next });
  };

  const selectAll = (side, sheet, onChange) => () => {
    onChange({ ...side, checkedMonths: new Set(sheet.months) });
  };

  const clearAll = (side, onChange) => () => {
    onChange({ ...side, checkedMonths: new Set() });
  };

  const changeSheet = (side, onChange) => (name) => {
    const target = sheets.find(s => s.name === name);
    onChange({ sheetName: name, checkedMonths: new Set(target?.months || []) });
  };

  const s1Sheet = sheets.find(s => s.name === side1.sheetName);
  const s2Sheet = sheets.find(s => s.name === side2.sheetName);
  const canAnalyze =
    side1.checkedMonths.size > 0 &&
    side2.checkedMonths.size > 0 &&
    side1.sheetName !== side2.sheetName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', marginTop: '32px' }}
    >
      <div className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Layers style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>시트별 비교</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SideCard
            title="기준 시트 (이전)"
            sheets={sheets}
            selectedName={side1.sheetName}
            checkedMonths={side1.checkedMonths}
            onSheetChange={changeSheet(side1, onSide1Change)}
            onToggleMonth={toggleMonth(side1, onSide1Change)}
            onSelectAll={selectAll(side1, s1Sheet, onSide1Change)}
            onClearAll={clearAll(side1, onSide1Change)}
            disabledSheetName={side2.sheetName}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight style={{ width: '22px', height: '22px', color: '#a78bfa' }} />
          </div>

          <SideCard
            title="비교 시트 (이후)"
            sheets={sheets}
            selectedName={side2.sheetName}
            checkedMonths={side2.checkedMonths}
            onSheetChange={changeSheet(side2, onSide2Change)}
            onToggleMonth={toggleMonth(side2, onSide2Change)}
            onSelectAll={selectAll(side2, s2Sheet, onSide2Change)}
            onClearAll={clearAll(side2, onSide2Change)}
            disabledSheetName={side1.sheetName}
          />
        </div>

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
              ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
              : 'rgba(51,65,85,0.4)',
            color: canAnalyze ? 'white' : '#64748b',
          }}
        >
          {canAnalyze
            ? '분석 시작'
            : side1.sheetName === side2.sheetName
              ? '두 시트를 서로 다르게 선택해주세요'
              : '각 시트에서 비교할 월을 체크해주세요'}
        </button>
      </div>
    </motion.div>
  );
}
