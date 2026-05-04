import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter, ArrowUpRight, ArrowDownRight, Plus, Minus, Search, X } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/formatters';
import { STATUS_COLORS } from '../constants/colors';

const STATUS_META = {
  new:       { label: '신규', Icon: Plus },
  removed:   { label: '제거', Icon: Minus },
  increased: { label: '증가', Icon: ArrowUpRight },
  decreased: { label: '감소', Icon: ArrowDownRight },
  unchanged: { label: '동일', Icon: null },
};

function statusStyle(status) {
  const c = STATUS_COLORS[status];
  const m = STATUS_META[status];
  return { ...m, color: c.fg, bg: c.bg, border: c.border };
}

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'removed', label: '제거' },
  { key: 'increased', label: '증가' },
  { key: 'decreased', label: '감소' },
];

function StatusBadge({ status }) {
  const s = statusStyle(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {s.Icon && <s.Icon style={{ width: '12px', height: '12px' }} />}
      {s.label}
    </span>
  );
}

function ExpandedRow({ item, result }) {
  return (
    <tr>
      <td colSpan={6} style={{ padding: '16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {item.prevItems.length > 0 && (
            <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                {formatMonthLabel(result.month1.label)} 상세 ({item.prevItems.length}건)
              </p>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {item.prevItems.map((entry, i) => (
                  <div key={`prev-${i}-${entry._amount}`} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '12px', color: '#94a3b8', padding: '6px 0',
                    borderBottom: '1px solid rgba(51,65,85,0.3)',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entry._description || entry._vendor || '-'}</span>
                    <span style={{ marginLeft: '16px', fontFamily: 'monospace', color: '#cbd5e1' }}>{formatMoney(entry._amount)}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.currItems.length > 0 && (
            <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                {formatMonthLabel(result.month2.label)} 상세 ({item.currItems.length}건)
              </p>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {item.currItems.map((entry, i) => (
                  <div key={`curr-${i}-${entry._amount}`} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '12px', color: '#94a3b8', padding: '6px 0',
                    borderBottom: '1px solid rgba(51,65,85,0.3)',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entry._description || entry._vendor || '-'}</span>
                    <span style={{ marginLeft: '16px', fontFamily: 'monospace', color: '#cbd5e1' }}>{formatMoney(entry._amount)}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function DetailTable({ result }) {
  const [filter, setFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortBy, setSortBy] = useState('diff');
  const [sortDir, setSortDir] = useState('desc');

  const data = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = result.categoryComparison.filter(c => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (searchTerm && !c.category.toLowerCase().includes(term)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'category') return mult * a.category.localeCompare(b.category);
      if (sortBy === 'prev') return mult * (a.prevAmount - b.prevAmount);
      if (sortBy === 'curr') return mult * (a.currAmount - b.currAmount);
      if (sortBy === 'diff') return mult * (Math.abs(a.diff) - Math.abs(b.diff));
      return 0;
    });
  }, [result.categoryComparison, filter, searchTerm, sortBy, sortDir]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const thStyle = (clickable) => ({
    textAlign: 'left', padding: '14px 16px',
    fontSize: '12px', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    cursor: clickable ? 'pointer' : 'default',
    whiteSpace: 'nowrap', userSelect: 'none',
  });

  const tdStyle = {
    padding: '14px 16px', fontSize: '14px',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ marginTop: '32px' }}
    >
      <div className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>카테고리별 증감 상세</h3>
          </div>

          <div style={{ position: 'relative' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearchTerm(searchInput); }}
              placeholder="카테고리 검색 (Enter)"
              aria-label="카테고리 검색 (엔터로 적용)"
              style={{
                paddingLeft: '36px', paddingRight: searchTerm ? '36px' : '16px', paddingTop: '10px', paddingBottom: '10px',
                borderRadius: '8px', background: 'rgba(15,23,42,0.6)',
                border: searchTerm ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(100,116,139,0.3)',
                fontSize: '14px', color: '#e2e8f0', outline: 'none', width: '260px',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                aria-label="검색어 지우기"
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(100,116,139,0.3)', border: 'none', borderRadius: '50%',
                  width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <X style={{ width: '12px', height: '12px', color: '#cbd5e1' }} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: filter === f.key ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(100,116,139,0.2)',
                background: filter === f.key ? 'rgba(59,130,246,0.15)' : 'rgba(15,23,42,0.4)',
                color: filter === f.key ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '12px' }}>
                  {result.categoryComparison.filter(c => c.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(51,65,85,0.5)' }}>
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
                    style={thStyle(col.key !== 'status')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {col.key !== 'status' && sortBy === col.key && (
                        sortDir === 'desc'
                          ? <ChevronDown style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                          : <ChevronUp style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                      )}
                    </span>
                  </th>
                ))}
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <React.Fragment key={item.category}>
                  <tr
                    onClick={() => setExpandedRow(expandedRow === item.category ? null : item.category)}
                    style={{
                      borderBottom: '1px solid rgba(30,41,59,0.5)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500, color: '#e2e8f0' }}>{item.category}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {item.prevAmount > 0 ? `${formatMoney(item.prevAmount)}원` : '-'}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {item.currAmount > 0 ? `${formatMoney(item.currAmount)}원` : '-'}
                    </td>
                    <td style={{
                      ...tdStyle, fontFamily: 'monospace', fontWeight: 600,
                      color: item.diff > 0 ? '#f87171' : item.diff < 0 ? '#34d399' : '#64748b',
                    }}>
                      {item.diff > 0 ? '+' : ''}{formatMoney(item.diff)}원
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <ChevronDown style={{
                        width: '16px', height: '16px', color: '#64748b',
                        transform: expandedRow === item.category ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }} />
                    </td>
                  </tr>
                  {expandedRow === item.category && (
                    <ExpandedRow item={item} result={result} />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: '14px' }}>
              해당하는 항목이 없습니다
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
