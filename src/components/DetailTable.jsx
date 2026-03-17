import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter, ArrowUpRight, ArrowDownRight, Plus, Minus, Search } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/excelParser';

const STATUS_CONFIG = {
  new: { label: '신규', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Plus },
  removed: { label: '제거', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', icon: Minus },
  increased: { label: '증가', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: ArrowUpRight },
  decreased: { label: '감소', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: ArrowDownRight },
  unchanged: { label: '동일', color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', icon: null },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function ExpandedRow({ item, result }) {
  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <td colSpan={6} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item.prevItems.length > 0 && (
            <div className="bg-slate-800/40 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-300 mb-3">
                {formatMonthLabel(result.month1.label)} 상세 ({item.prevItems.length}건)
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {item.prevItems.map((entry, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-400 py-1 border-b border-slate-700/30">
                    <span className="truncate flex-1">{entry._description || entry._vendor || '-'}</span>
                    <span className="ml-4 font-mono text-slate-300">{formatMoney(entry._amount)}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.currItems.length > 0 && (
            <div className="bg-slate-800/40 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-300 mb-3">
                {formatMonthLabel(result.month2.label)} 상세 ({item.currItems.length}건)
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {item.currItems.map((entry, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-400 py-1 border-b border-slate-700/30">
                    <span className="truncate flex-1">{entry._description || entry._vendor || '-'}</span>
                    <span className="ml-4 font-mono text-slate-300">{formatMoney(entry._amount)}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function DetailTable({ result }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortBy, setSortBy] = useState('diff');
  const [sortDir, setSortDir] = useState('desc');

  const filters = [
    { key: 'all', label: '전체' },
    { key: 'new', label: '신규' },
    { key: 'removed', label: '제거' },
    { key: 'increased', label: '증가' },
    { key: 'decreased', label: '감소' },
  ];

  let data = result.categoryComparison.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchTerm && !c.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  data = [...data].sort((a, b) => {
    const mult = sortDir === 'desc' ? -1 : 1;
    if (sortBy === 'category') return mult * a.category.localeCompare(b.category);
    if (sortBy === 'prev') return mult * (a.prevAmount - b.prevAmount);
    if (sortBy === 'curr') return mult * (a.currAmount - b.currAmount);
    if (sortBy === 'diff') return mult * (Math.abs(a.diff) - Math.abs(b.diff));
    return 0;
  });

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-blue-400" />
      : <ChevronUp className="w-3 h-3 text-blue-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="relative z-10 max-w-7xl mx-auto px-6 mt-8"
    >
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-400" />
            카테고리별 증감 상세
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="카테고리 검색..."
              className="pl-9 pr-4 py-2 rounded-lg bg-slate-800/60 border border-slate-600/30 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400/50 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <motion.button
              key={f.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-600/20 hover:border-slate-500/30'
              }`}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {result.categoryComparison.filter(c => f.key === 'all' || c.status === f.key).length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {[
                  { key: 'category', label: '카테고리' },
                  { key: 'prev', label: formatMonthLabel(result.month1.label) },
                  { key: 'curr', label: formatMonthLabel(result.month2.label) },
                  { key: 'diff', label: '증감액' },
                  { key: 'status', label: '상태' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'status' && handleSort(col.key)}
                    className={`text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider ${
                      col.key !== 'status' ? 'cursor-pointer hover:text-slate-300' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.key !== 'status' && <SortIcon col={col.key} />}
                    </span>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data.map((item, i) => (
                  <motion.tbody
                    key={item.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                  >
                    <tr
                      onClick={() => setExpandedRow(expandedRow === item.category ? null : item.category)}
                      className="table-row-hover cursor-pointer border-b border-slate-800/30"
                    >
                      <td className="py-3 px-4 font-medium text-slate-200">{item.category}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {item.prevAmount > 0 ? `${formatMoney(item.prevAmount)}원` : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {item.currAmount > 0 ? `${formatMoney(item.currAmount)}원` : '-'}
                      </td>
                      <td className={`py-3 px-4 font-mono font-semibold ${
                        item.diff > 0 ? 'text-red-400' : item.diff < 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {item.diff > 0 ? '+' : ''}{formatMoney(item.diff)}원
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4">
                        <motion.div
                          animate={{ rotate: expandedRow === item.category ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </motion.div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRow === item.category && (
                        <ExpandedRow item={item} result={result} />
                      )}
                    </AnimatePresence>
                  </motion.tbody>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {data.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              해당하는 항목이 없습니다
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
