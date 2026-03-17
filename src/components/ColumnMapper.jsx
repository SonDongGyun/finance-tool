import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, CheckCircle2 } from 'lucide-react';
import {
  detectDateColumn, detectAmountColumns,
  detectCategoryColumn, detectDescriptionColumn, detectVendorColumn
} from '../utils/excelParser';

export default function ColumnMapper({ headers, onConfirm }) {
  const [dateCol, setDateCol] = useState('');
  const [debitCol, setDebitCol] = useState('');
  const [creditCol, setCreditCol] = useState('');
  const [amountCol, setAmountCol] = useState('');
  const [categoryCol, setCategoryCol] = useState('');
  const [descCol, setDescCol] = useState('');
  const [vendorCol, setVendorCol] = useState('');
  const [useDebitCredit, setUseDebitCredit] = useState(true);

  useEffect(() => {
    const detectedDate = detectDateColumn(headers);
    const detectedAmount = detectAmountColumns(headers);
    const detectedCategory = detectCategoryColumn(headers);
    const detectedDesc = detectDescriptionColumn(headers);
    const detectedVendor = detectVendorColumn(headers);

    if (detectedDate) setDateCol(detectedDate);
    if (detectedAmount.debit) setDebitCol(detectedAmount.debit);
    if (detectedAmount.credit) setCreditCol(detectedAmount.credit);
    if (detectedAmount.amount) {
      setAmountCol(detectedAmount.amount);
      if (!detectedAmount.debit) setUseDebitCredit(false);
    }
    if (detectedCategory) setCategoryCol(detectedCategory);
    if (detectedDesc) setDescCol(detectedDesc);
    if (detectedVendor) setVendorCol(detectedVendor);
  }, [headers]);

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

  const SelectField = ({ label, value, onChange, required }) => (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-600/30 text-sm text-slate-200 focus:outline-none focus:border-blue-400/50 transition-all appearance-none cursor-pointer"
      >
        <option value="">선택 안함</option>
        {headers.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative z-10 max-w-3xl mx-auto px-6 mt-8"
    >
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Settings2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-slate-200">컬럼 매핑 설정</h3>
        </div>

        <p className="text-sm text-slate-400 mb-6">
          자동 감지된 컬럼을 확인하고, 필요시 수정해주세요.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="날짜 컬럼" value={dateCol} onChange={setDateCol} required />
          <SelectField label="카테고리/계정과목 컬럼" value={categoryCol} onChange={setCategoryCol} />

          <div className="sm:col-span-2">
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setUseDebitCredit(true)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  useDebitCredit ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' : 'bg-slate-800/40 text-slate-400 border border-slate-600/20'
                }`}
              >
                차변/대변
              </button>
              <button
                onClick={() => setUseDebitCredit(false)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  !useDebitCredit ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' : 'bg-slate-800/40 text-slate-400 border border-slate-600/20'
                }`}
              >
                단일 금액
              </button>
            </div>
          </div>

          {useDebitCredit ? (
            <>
              <SelectField label="차변(지출) 컬럼" value={debitCol} onChange={setDebitCol} required />
              <SelectField label="대변(수입) 컬럼" value={creditCol} onChange={setCreditCol} />
            </>
          ) : (
            <SelectField label="금액 컬럼" value={amountCol} onChange={setAmountCol} required />
          )}

          <SelectField label="적요/설명 컬럼" value={descCol} onChange={setDescCol} />
          <SelectField label="거래처 컬럼" value={vendorCol} onChange={setVendorCol} />
        </div>

        <motion.button
          whileHover={{ scale: canConfirm ? 1.02 : 1 }}
          whileTap={{ scale: canConfirm ? 0.98 : 1 }}
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={`
            mt-6 w-full py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300
            ${canConfirm
              ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
              : 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          <CheckCircle2 className="w-5 h-5" />
          컬럼 매핑 확인
        </motion.button>
      </div>
    </motion.div>
  );
}
