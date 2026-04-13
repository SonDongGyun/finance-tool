import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, PlusCircle, MinusCircle, AlertTriangle, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/excelParser';

function fmt(amount) {
  return formatMoney(Math.abs(amount));
}

const DEFAULT_SHOW_COUNT = 5;

const THRESHOLD_OPTIONS = [
  { label: '전체', value: 0 },
  { label: '10만원 이상', value: 100000 },
  { label: '50만원 이상', value: 500000 },
  { label: '100만원 이상', value: 1000000 },
  { label: '500만원 이상', value: 5000000 },
];

function ShowMoreButton({ total, visible, onClick }) {
  if (total <= visible) return null;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '8px', marginTop: '6px',
        borderRadius: '8px', fontSize: '12px', fontWeight: 600,
        background: 'rgba(100,116,139,0.1)', color: '#94a3b8',
        border: '1px solid rgba(100,116,139,0.15)',
        cursor: 'pointer',
      }}
    >
      +{total - visible}건 더보기
    </button>
  );
}

function ShowLessButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '8px', marginTop: '6px',
        borderRadius: '8px', fontSize: '12px', fontWeight: 600,
        background: 'rgba(100,116,139,0.1)', color: '#94a3b8',
        border: '1px solid rgba(100,116,139,0.15)',
        cursor: 'pointer',
      }}
    >
      접기
    </button>
  );
}

function KeyChangeItem({ item, type }) {
  const [expanded, setExpanded] = useState(false);
  const isNew = type === 'new';
  const amount = isNew ? item.currAmount : item.prevAmount;
  const items = isNew ? item.currItems : item.prevItems;

  return (
    <div
      onClick={() => items.length > 0 && setExpanded(!expanded)}
      style={{
        background: isNew ? 'rgba(59,130,246,0.08)' : 'rgba(249,115,22,0.08)',
        border: `1px solid ${isNew ? 'rgba(59,130,246,0.2)' : 'rgba(249,115,22,0.2)'}`,
        borderRadius: '10px',
        padding: '12px 16px',
        cursor: items.length > 0 ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {isNew
            ? <PlusCircle style={{ width: '16px', height: '16px', color: '#60a5fa', flexShrink: 0 }} />
            : <MinusCircle style={{ width: '16px', height: '16px', color: '#fb923c', flexShrink: 0 }} />
          }
          <span style={{
            fontSize: '14px', fontWeight: 600, color: '#e2e8f0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.category}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{
            fontSize: '14px', fontWeight: 700, fontFamily: 'monospace',
            color: isNew ? '#60a5fa' : '#fb923c',
          }}>
            {formatMoney(amount)}원
          </span>
          {items.length > 0 && (
            <ChevronDown style={{
              width: '14px', height: '14px', color: '#64748b',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '10px', paddingTop: '10px',
              borderTop: `1px solid ${isNew ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)'}`,
            }}>
              {items.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '12px', padding: '4px 0', color: '#94a3b8',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {entry._description || entry._vendor || '-'}
                  </span>
                  <span style={{ marginLeft: '12px', fontFamily: 'monospace', color: '#cbd5e1', flexShrink: 0 }}>
                    {formatMoney(entry._amount)}원
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KeyChangeList({ items, type }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, DEFAULT_SHOW_COUNT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {visible.length > 0 ? visible.map(item => (
        <KeyChangeItem key={item.category} item={item} type={type} />
      )) : (
        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>없음</p>
      )}
      {!showAll && (
        <ShowMoreButton total={items.length} visible={visible.length} onClick={() => setShowAll(true)} />
      )}
      {showAll && items.length > DEFAULT_SHOW_COUNT && (
        <ShowLessButton onClick={() => setShowAll(false)} />
      )}
    </div>
  );
}

function generateSummaryLines(result) {
  const lines = [];
  const m1Label = formatMonthLabel(result.month1.label);
  const m2Label = formatMonthLabel(result.month2.label);

  const totalDiff = result.totalDiff;
  if (totalDiff > 0) {
    lines.push({ type: 'increase', text: `${m1Label} 대비 ${m2Label} 총 비용이 ${fmt(totalDiff)}원 증가했습니다 (${result.totalPctChange > 0 ? '+' : ''}${result.totalPctChange}%).` });
  } else if (totalDiff < 0) {
    lines.push({ type: 'decrease', text: `${m1Label} 대비 ${m2Label} 총 비용이 ${fmt(totalDiff)}원 감소했습니다 (${result.totalPctChange}%).` });
  } else {
    lines.push({ type: 'neutral', text: `${m1Label}과 ${m2Label}의 총 비용이 동일합니다.` });
  }

  result.increasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).forEach(item => {
    lines.push({ type: 'increase', text: `${item.category} 비용이 ${fmt(item.prevAmount)}원에서 ${fmt(item.currAmount)}원으로 ${fmt(item.diff)}원 증가 (+${item.pctChange}%).` });
  });

  result.decreasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).forEach(item => {
    lines.push({ type: 'decrease', text: `${item.category} 비용이 ${fmt(item.prevAmount)}원에서 ${fmt(item.currAmount)}원으로 ${fmt(Math.abs(item.diff))}원 감소 (${item.pctChange}%).` });
  });

  result.vendorComparison.forEach(v => {
    if (v.status === 'new') {
      lines.push({ type: 'new', text: `거래처 "${v.vendor}" 신규 거래 발생, ${fmt(v.currAmount)}원 지출.` });
    } else if (v.status === 'removed') {
      lines.push({ type: 'removed', text: `거래처 "${v.vendor}" 당월 거래 없음 (전월 ${fmt(v.prevAmount)}원).` });
    } else if (v.diff > 0) {
      lines.push({ type: 'increase', text: `거래처 "${v.vendor}" 비용 ${fmt(v.diff)}원 증가.` });
    } else if (v.diff < 0) {
      lines.push({ type: 'decrease', text: `거래처 "${v.vendor}" 비용 ${fmt(Math.abs(v.diff))}원 감소.` });
    }
  });

  return lines;
}

const dotColors = {
  increase: '#f87171',
  decrease: '#34d399',
  new: '#60a5fa',
  removed: '#fb923c',
  neutral: '#94a3b8',
};

export default function AnalysisSummary({ result }) {
  const [threshold, setThreshold] = useState(100000);
  const [showAllLines, setShowAllLines] = useState(false);
  const lines = generateSummaryLines(result);

  const m1Label = formatMonthLabel(result.month1.label);
  const m2Label = formatMonthLabel(result.month2.label);

  const newItems = result.newItems
    .filter(item => item.currAmount >= threshold)
    .sort((a, b) => b.currAmount - a.currAmount);

  const removedItems = result.removedItems
    .filter(item => item.prevAmount >= threshold)
    .sort((a, b) => b.prevAmount - a.prevAmount);

  const hasKeyChanges = result.newItems.length > 0 || result.removedItems.length > 0;

  const visibleLines = showAllLines ? lines : lines.slice(0, DEFAULT_SHOW_COUNT);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      style={{ marginTop: '32px' }}
    >
      <div className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <MessageSquareText style={{ width: '20px', height: '20px', color: '#fbbf24' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>분석 요약</h3>
        </div>

        {/* Key Changes Section */}
        {hasKeyChanges && (
          <div style={{
            marginBottom: '28px', padding: '20px',
            background: 'rgba(251,191,36,0.04)',
            border: '1px solid rgba(251,191,36,0.15)',
            borderRadius: '12px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>
                  주요 비용 변동
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal style={{ width: '13px', height: '13px', color: '#64748b' }} />
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  style={{
                    padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                    background: 'rgba(15,23,42,0.6)', color: '#cbd5e1',
                    border: '1px solid rgba(100,116,139,0.3)',
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  {THRESHOLD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {newItems.length === 0 && removedItems.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '8px 0' }}>
                해당 금액 기준에 해당하는 변동 항목이 없습니다.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* New items */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '10px', paddingBottom: '8px',
                    borderBottom: '1px solid rgba(59,130,246,0.15)',
                  }}>
                    <PlusCircle style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa' }}>
                      이번달 신규 발생
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>({newItems.length}건)</span>
                  </div>
                  <KeyChangeList items={newItems} type="new" />
                </div>

                {/* Removed items */}
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '10px', paddingBottom: '8px',
                    borderBottom: '1px solid rgba(249,115,22,0.15)',
                  }}>
                    <MinusCircle style={{ width: '14px', height: '14px', color: '#fb923c' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fb923c' }}>
                      이번달 미발생 (전월 있음)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>({removedItems.length}건)</span>
                  </div>
                  <KeyChangeList items={removedItems} type="removed" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary lines with show more/less */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '10px 14px', borderRadius: '8px',
              }}
            >
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                marginTop: '7px', flexShrink: 0,
                background: dotColors[line.type],
              }} />
              <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{line.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Show more / less for summary lines */}
        {lines.length > DEFAULT_SHOW_COUNT && (
          <button
            onClick={() => setShowAllLines(!showAllLines)}
            style={{
              width: '100%', padding: '10px', marginTop: '12px',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: 'rgba(100,116,139,0.08)', color: '#94a3b8',
              border: '1px solid rgba(100,116,139,0.15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
            }}
          >
            <ChevronDown style={{
              width: '14px', height: '14px',
              transform: showAllLines ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
            {showAllLines ? '접기' : `+${lines.length - DEFAULT_SHOW_COUNT}건 더보기`}
          </button>
        )}

        {lines.length === 0 && !hasKeyChanges && (
          <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>변동 사항이 없습니다.</p>
        )}
      </div>
    </motion.div>
  );
}
