import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Minus, ArrowUpRight, ArrowDownRight, Equal, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatMoney, formatMonthLabel } from '../utils/formatters';
import { GRADIENTS } from '../constants/colors';
import type { AnalysisResult } from '../types';

const ANIMATION_DURATION_MS = 1500;

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

// Animates from the currently displayed value to the new target on each prop change,
// using requestAnimationFrame so cleanup cancels in-flight frames cleanly.
function AnimatedNumber({ value, prefix = '', suffix = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (value === startRef.current) return;
    const startValue = startRef.current;
    const targetValue = value;
    let startTime: number | null = null;
    let frameId: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const t = Math.min((timestamp - startTime) / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = t < 1
        ? Math.round(startValue + (targetValue - startValue) * eased)
        : targetValue;
      startRef.current = next;
      setDisplay(next);
      if (t < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [value]);

  return <span>{prefix}{formatMoney(display)}{suffix}</span>;
}

interface SummaryCardsProps {
  result: AnalysisResult;
}

export default function SummaryCards({ result }: SummaryCardsProps) {
  const {
    month1, month2, totalDiff, totalPctChange,
    newItems, removedItems, increasedItems, decreasedItems,
    skippedRowCount, skippedSummaryCount, monthlyOnlyCategories,
  } = result;

  const cards = [
    {
      label: formatMonthLabel(month1.label),
      value: month1.total,
      sub: `${month1.count}건`,
      icon: <Equal style={{ width: '20px', height: '20px' }} />,
      gradient: GRADIENTS.slate,
    },
    {
      label: formatMonthLabel(month2.label),
      value: month2.total,
      sub: `${month2.count}건`,
      icon: <Equal style={{ width: '20px', height: '20px' }} />,
      gradient: GRADIENTS.blueDeep,
    },
    {
      label: '총 증감액',
      value: totalDiff,
      sub: `${totalPctChange > 0 ? '+' : ''}${totalPctChange}%`,
      icon: totalDiff >= 0
        ? <TrendingUp style={{ width: '20px', height: '20px' }} />
        : <TrendingDown style={{ width: '20px', height: '20px' }} />,
      gradient: totalDiff >= 0
        ? GRADIENTS.warmReverse
        : GRADIENTS.success,
    },
  ];

  const changeCards = [
    { label: '신규 항목', count: newItems.length, icon: <Plus style={{ width: '16px', height: '16px' }} />, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
    { label: '제거 항목', count: removedItems.length, icon: <Minus style={{ width: '16px', height: '16px' }} />, color: '#fb923c', bg: 'rgba(249,115,22,0.1)' },
    { label: '증가 항목', count: increasedItems.length, icon: <ArrowUpRight style={{ width: '16px', height: '16px' }} />, color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
    { label: '감소 항목', count: decreasedItems.length, icon: <ArrowDownRight style={{ width: '16px', height: '16px' }} />, color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ marginTop: '40px' }}
    >
      {/* Main summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass"
            style={{ borderRadius: '16px', padding: '28px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{card.label}</span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: card.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>
              <AnimatedNumber
                value={Math.abs(card.value)}
                prefix={card.value < 0 ? '-' : ''}
                suffix="원"
              />
            </div>
            <div style={{
              fontSize: '14px', marginTop: '6px',
              color: card.label === '총 증감액'
                ? totalDiff >= 0 ? '#f87171' : '#34d399'
                : '#94a3b8',
              fontWeight: 500,
            }}>
              {card.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Change type cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {changeCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="glass-light"
            style={{ borderRadius: '14px', padding: '24px 16px', textAlign: 'center' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px',
              background: card.bg, color: card.color,
              fontSize: '12px', fontWeight: 600, marginBottom: '12px',
            }}>
              {card.icon}
              {card.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{card.count}</div>
          </motion.div>
        ))}
      </div>

      {skippedRowCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          role="status"
          style={{
            marginTop: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.25)',
            color: '#fcd34d', fontSize: '13px',
          }}
        >
          <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>
            날짜를 인식하지 못한 <strong>{skippedRowCount.toLocaleString('ko-KR')}건</strong>이 분석에서 제외되었어요.
            합계가 원본 엑셀과 다를 수 있다면 날짜 컬럼 형식을 확인해주세요.
          </span>
        </motion.div>
      )}

      {(skippedSummaryCount > 0 || monthlyOnlyCategories.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          role="status"
          style={{
            marginTop: '12px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(96,165,250,0.08)',
            border: '1px solid rgba(96,165,250,0.25)',
            color: '#bfdbfe', fontSize: '13px', lineHeight: 1.6,
          }}
        >
          <Info style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
          <div>
            {skippedSummaryCount > 0 && (
              <div>
                <strong>월계·누계 행 {skippedSummaryCount.toLocaleString('ko-KR')}건</strong>은
                회계장부 합계 행으로 자동 인식되어 분석 중복을 막기 위해 제외되었어요.
              </div>
            )}
            {monthlyOnlyCategories.length > 0 && (
              <div style={{ marginTop: skippedSummaryCount > 0 ? '6px' : 0 }}>
                개별 거래가 없는 다음 계정은 <strong>월계 행</strong>을 데이터로 사용했어요:&nbsp;
                <strong>{monthlyOnlyCategories.join(', ')}</strong>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
