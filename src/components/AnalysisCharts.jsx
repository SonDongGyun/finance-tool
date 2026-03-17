import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, PieChartIcon } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/excelParser';

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
  '#84cc16', '#a855f7', '#0ea5e9', '#22c55e', '#eab308',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-sm shadow-xl">
      <p className="font-medium text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {formatMoney(p.value)}원
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-sm shadow-xl">
      <p className="font-medium text-slate-200">{payload[0].name}</p>
      <p className="text-xs text-slate-300">{formatMoney(payload[0].value)}원</p>
      <p className="text-xs text-slate-400">{(payload[0].percent * 100).toFixed(1)}%</p>
    </div>
  );
}

export default function AnalysisCharts({ result }) {
  const [chartView, setChartView] = useState('bar');

  const barData = result.categoryComparison.slice(0, 12).map(c => ({
    name: c.category.length > 8 ? c.category.substring(0, 8) + '...' : c.category,
    fullName: c.category,
    [formatMonthLabel(result.month1.label)]: c.prevAmount,
    [formatMonthLabel(result.month2.label)]: c.currAmount,
  }));

  const pieData1 = result.categoryComparison
    .filter(c => c.prevAmount > 0)
    .slice(0, 8)
    .map(c => ({ name: c.category, value: c.prevAmount }));

  const pieData2 = result.categoryComparison
    .filter(c => c.currAmount > 0)
    .slice(0, 8)
    .map(c => ({ name: c.category, value: c.currAmount }));

  const m1Label = formatMonthLabel(result.month1.label);
  const m2Label = formatMonthLabel(result.month2.label);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative z-10 max-w-7xl mx-auto px-6 mt-8"
    >
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            카테고리별 비교
          </h3>
          <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
            <button
              onClick={() => setChartView('bar')}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                chartView === 'bar'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartView('pie')}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                chartView === 'pie'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {chartView === 'bar' ? (
            <motion.div
              key="bar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={m1Label}
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey={m2Label}
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                    animationBegin={300}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="pie"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-[400px] grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <p className="text-center text-sm text-slate-400 mb-2">{m1Label}</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData1}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      animationDuration={1000}
                      label={({ name, percent }) =>
                        percent > 0.05 ? `${name.substring(0, 6)} ${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {pieData1.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-center text-sm text-slate-400 mb-2">{m2Label}</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData2}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      animationDuration={1000}
                      animationBegin={500}
                      label={({ name, percent }) =>
                        percent > 0.05 ? `${name.substring(0, 6)} ${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {pieData2.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        {chartView === 'bar' && (
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-3 h-3 rounded bg-[#6366f1]" />
              {m1Label}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-3 h-3 rounded bg-[#06b6d4]" />
              {m2Label}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
