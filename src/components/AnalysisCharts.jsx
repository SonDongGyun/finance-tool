import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/excelParser';

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
  '#84cc16', '#a855f7', '#0ea5e9', '#22c55e', '#eab308',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px',
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', fontSize: '13px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '12px', margin: '2px 0' }}>
          {p.name}: {formatMoney(p.value)}원
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px',
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '13px' }}>{payload[0].name}</p>
      <p style={{ fontSize: '12px', color: '#cbd5e1' }}>{formatMoney(payload[0].value)}원</p>
      <p style={{ fontSize: '12px', color: '#94a3b8' }}>{(payload[0].percent * 100).toFixed(1)}%</p>
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

  const pieData1 = result.categoryComparison.filter(c => c.prevAmount > 0).slice(0, 8).map(c => ({ name: c.category, value: c.prevAmount }));
  const pieData2 = result.categoryComparison.filter(c => c.currAmount > 0).slice(0, 8).map(c => ({ name: c.category, value: c.currAmount }));

  const m1Label = formatMonthLabel(result.month1.label);
  const m2Label = formatMonthLabel(result.month2.label);

  const chartBtnStyle = (active) => ({
    padding: '8px 14px', borderRadius: '8px', border: 'none',
    fontSize: '13px', cursor: 'pointer',
    background: active ? 'rgba(59,130,246,0.2)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
    display: 'flex', alignItems: 'center', gap: '6px',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ marginTop: '32px' }}
    >
      <div className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>카테고리별 비교</h3>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(15,23,42,0.5)', borderRadius: '10px', padding: '4px' }}>
            <button onClick={() => setChartView('bar')} style={chartBtnStyle(chartView === 'bar')}>
              <BarChart3 style={{ width: '16px', height: '16px' }} /> 막대
            </button>
            <button onClick={() => setChartView('pie')} style={chartBtnStyle(chartView === 'pie')}>
              <PieChartIcon style={{ width: '16px', height: '16px' }} /> 파이
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {chartView === 'bar' ? (
            <motion.div
              key="bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: '420px' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey={m1Label} fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  <Bar dataKey={m2Label} fill="#06b6d4" radius={[4, 4, 0, 0]} animationDuration={1000} animationBegin={300} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="pie"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: '420px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
            >
              <div>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>{m1Label}</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={pieData1} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={60} animationDuration={1000}
                      label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 6)} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                      {pieData1.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>{m2Label}</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={pieData2} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={60} animationDuration={1000} animationBegin={500}
                      label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 6)} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                      {pieData2.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {chartView === 'bar' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6366f1' }} />
              {m1Label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#06b6d4' }} />
              {m2Label}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
