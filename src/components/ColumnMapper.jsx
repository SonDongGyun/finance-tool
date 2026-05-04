import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, CheckCircle2 } from 'lucide-react';
import {
  detectDateColumn, detectAmountColumns,
  detectCategoryColumn, detectDescriptionColumn, detectVendorColumn
} from '../utils/excel/detector';
import { GRADIENTS } from '../constants/colors';
import { cardStyle, selectStyle, labelStyle } from '../styles/common';

function SelectField({ label, value, onChange, required, headers }) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#f87171' }}>*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        <option value="">선택 안함</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}

export default function ColumnMapper({ headers, onConfirm }) {
  // Single detection pass; previously detectAmountColumns ran four times during
  // initial state setup.
  const detected = useMemo(() => ({
    date: detectDateColumn(headers),
    amount: detectAmountColumns(headers),
    category: detectCategoryColumn(headers),
    description: detectDescriptionColumn(headers),
    vendor: detectVendorColumn(headers),
  }), [headers]);

  const [dateCol, setDateCol] = useState(() => detected.date || '');
  const [debitCol, setDebitCol] = useState(() => detected.amount.debit || '');
  const [creditCol, setCreditCol] = useState(() => detected.amount.credit || '');
  const [amountCol, setAmountCol] = useState(() => detected.amount.amount || '');
  const [categoryCol, setCategoryCol] = useState(() => detected.category || '');
  const [descCol, setDescCol] = useState(() => detected.description || '');
  const [vendorCol, setVendorCol] = useState(() => detected.vendor || '');
  const [useDebitCredit, setUseDebitCredit] = useState(
    () => Boolean(detected.amount.debit) || !detected.amount.amount,
  );

  const canConfirm = dateCol && (useDebitCredit ? debitCol : amountCol);

  const handleConfirm = () => {
    onConfirm({
      dateColumn: dateCol,
      amountColumns: useDebitCredit
        ? { debit: debitCol, credit: creditCol }
        : { amount: amountCol },
      categoryColumn: categoryCol || null,
      descriptionColumn: descCol || null,
      vendorColumn: vendorCol || null,
    });
  };

  const tabBtn = (active, label, onClick) => (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        border: active ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(100,116,139,0.2)',
        background: active ? 'rgba(59,130,246,0.15)' : 'rgba(30,41,59,0.4)',
        color: active ? '#60a5fa' : '#94a3b8',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', marginTop: '32px' }}
    >
      <div className="glass" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Settings2 style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>컬럼 매핑 설정</h3>
        </div>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px' }}>
          자동 감지된 컬럼을 확인하고, 필요시 수정해주세요.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <SelectField label="날짜 컬럼" value={dateCol} onChange={setDateCol} required headers={headers} />
          <SelectField label="카테고리/계정과목 컬럼" value={categoryCol} onChange={setCategoryCol} headers={headers} />

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginBottom: '4px' }}>
            {tabBtn(useDebitCredit, '차변/대변', () => setUseDebitCredit(true))}
            {tabBtn(!useDebitCredit, '단일 금액', () => setUseDebitCredit(false))}
          </div>

          {useDebitCredit ? (
            <>
              <SelectField label="차변(지출) 컬럼" value={debitCol} onChange={setDebitCol} required headers={headers} />
              <SelectField label="대변(수입) 컬럼" value={creditCol} onChange={setCreditCol} headers={headers} />
            </>
          ) : (
            <SelectField label="금액 컬럼" value={amountCol} onChange={setAmountCol} required headers={headers} />
          )}

          <SelectField label="적요/설명 컬럼" value={descCol} onChange={setDescCol} headers={headers} />
          <SelectField label="거래처 컬럼" value={vendorCol} onChange={setVendorCol} headers={headers} />
        </div>

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={{
            marginTop: '28px',
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            background: canConfirm
              ? GRADIENTS.primaryReverse
              : 'rgba(51,65,85,0.4)',
            color: canConfirm ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px' }} />
          컬럼 매핑 확인
        </button>
      </div>
    </motion.div>
  );
}
