import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { formatMonthLabel } from '../utils/excelParser';

export default function MonthSelector({ months, month1, month2, onMonth1Change, onMonth2Change, onAnalyze }) {
  const canAnalyze = month1 && month2 && month1 !== month2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative z-10 max-w-3xl mx-auto px-6 mt-8"
    >
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-200">비교할 월 선택</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-2">기준월 (이전)</label>
            <select
              value={month1}
              onChange={(e) => onMonth1Change(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/30 text-slate-200 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">월 선택</option>
              {months.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>

          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="hidden sm:flex items-center pt-6"
          >
            <ArrowRight className="w-6 h-6 text-purple-400" />
          </motion.div>

          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-2">비교월 (이후)</label>
            <select
              value={month2}
              onChange={(e) => onMonth2Change(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/30 text-slate-200 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">월 선택</option>
              {months.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: canAnalyze ? 1.02 : 1 }}
          whileTap={{ scale: canAnalyze ? 0.98 : 1 }}
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`
            mt-6 w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-300
            ${canAnalyze
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
              : 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {canAnalyze ? '분석 시작' : '두 달을 모두 선택해주세요'}
        </motion.button>
      </div>
    </motion.div>
  );
}
