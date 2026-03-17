import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Minus, ArrowUpRight, ArrowDownRight, Equal } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/excelParser';
import { useEffect, useState } from 'react';

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{formatMoney(display)}{suffix}</span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function SummaryCards({ result }) {
  const { month1, month2, totalDiff, totalPctChange, newItems, removedItems, increasedItems, decreasedItems } = result;

  const cards = [
    {
      label: formatMonthLabel(month1.label),
      value: month1.total,
      sub: `${month1.count}건`,
      icon: <Equal className="w-5 h-5" />,
      color: 'from-slate-500 to-slate-600',
      glow: '',
    },
    {
      label: formatMonthLabel(month2.label),
      value: month2.total,
      sub: `${month2.count}건`,
      icon: <Equal className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/20',
    },
    {
      label: '총 증감액',
      value: totalDiff,
      sub: `${totalPctChange > 0 ? '+' : ''}${totalPctChange}%`,
      icon: totalDiff >= 0
        ? <TrendingUp className="w-5 h-5" />
        : <TrendingDown className="w-5 h-5" />,
      color: totalDiff >= 0 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-teal-500',
      glow: totalDiff >= 0 ? 'shadow-red-500/20' : 'shadow-emerald-500/20',
    },
  ];

  const changeCards = [
    { label: '신규 항목', count: newItems.length, icon: <Plus className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: '제거 항목', count: removedItems.length, icon: <Minus className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: '증가 항목', count: increasedItems.length, icon: <ArrowUpRight className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: '감소 항목', count: decreasedItems.length, icon: <ArrowDownRight className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 max-w-7xl mx-auto px-6 mt-10"
    >
      {/* Main summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`glass rounded-2xl p-6 shadow-lg ${card.glow}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedNumber
                value={Math.abs(card.value)}
                prefix={card.value < 0 ? '-' : ''}
                suffix="원"
              />
            </div>
            <div className={`text-sm mt-1 ${
              card.label === '총 증감액'
                ? totalDiff >= 0 ? 'text-red-400' : 'text-emerald-400'
                : 'text-slate-400'
            }`}>
              {card.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Change type cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {changeCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i + 3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            className="glass-light rounded-xl p-4 text-center"
          >
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${card.bg} ${card.color} text-xs font-medium mb-2`}>
              {card.icon}
              {card.label}
            </div>
            <div className="text-3xl font-bold text-white">{card.count}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
