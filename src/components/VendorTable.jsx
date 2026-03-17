import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowUpDown } from 'lucide-react';
import { formatMoney } from '../utils/excelParser';

export default function VendorTable({ result }) {
  const [showAll, setShowAll] = useState(false);

  const data = showAll ? result.vendorComparison : result.vendorComparison.slice(0, 15);

  if (result.vendorComparison.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="relative z-10 max-w-7xl mx-auto px-6 mt-8"
    >
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-cyan-400" />
          거래처별 변동 내역
        </h3>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">거래처</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">이전</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">현재</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">증감</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">변동</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <motion.tr
                  key={item.vendor}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="table-row-hover border-b border-slate-800/30"
                >
                  <td className="py-3 px-4 text-slate-200 max-w-[200px] truncate">{item.vendor}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.prevAmount > 0 ? `${formatMoney(item.prevAmount)}원` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.currAmount > 0 ? `${formatMoney(item.currAmount)}원` : '-'}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${
                    item.diff > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {item.diff > 0 ? '+' : ''}{formatMoney(item.diff)}원
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="w-full bg-slate-800/60 rounded-full h-2 max-w-[100px] mx-auto overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (Math.abs(item.diff) / (result.vendorComparison[0]?.diff ? Math.abs(result.vendorComparison[0].diff) : 1)) * 100)}%` }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                        className={`h-full rounded-full ${item.diff > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.vendorComparison.length > 15 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 rounded-lg text-sm bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 transition-colors"
            >
              {showAll ? '접기' : `전체 보기 (${result.vendorComparison.length}건)`}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
