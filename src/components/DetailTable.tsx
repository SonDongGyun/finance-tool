import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import SearchInput from './SearchInput';
import StatusFilterBar, { type StatusFilterKey, type StatusFilterCounts } from './StatusFilterBar';
import ExpandedDetailRow from './ExpandedDetailRow';
import { cardStyle } from '../styles/common';
import { thStyle, tdStyle } from '../styles/table';
import type { AnalysisResult } from '../types';

type DetailSortKey = 'category' | 'prev' | 'curr' | 'diff';
type SortDir = 'asc' | 'desc';

interface DetailTableProps {
  result: AnalysisResult;
}

export default function DetailTable({ result }: DetailTableProps) {
  const [filter, setFilter] = useState<StatusFilterKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<DetailSortKey>('diff');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filterCounts = useMemo<StatusFilterCounts>(() => {
    const c: StatusFilterCounts = { new: 0, removed: 0, increased: 0, decreased: 0 };
    result.categoryComparison.forEach(item => {
      if (item.status === 'unchanged') return;
      c[item.status] = (c[item.status] ?? 0) + 1;
    });
    return c;
  }, [result.categoryComparison]);

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

  const handleSort = (col: DetailSortKey) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ marginTop: '32px' }}
    >
      <div className="glass" style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>카테고리별 증감 상세</h3>
          </div>

          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => setSearchTerm(searchInput)}
            term={searchTerm}
            onClear={() => { setSearchInput(''); setSearchTerm(''); }}
            placeholder="카테고리 검색 (Enter)"
            ariaLabel="카테고리 검색 (엔터로 적용)"
          />
        </div>

        {/* Filters */}
        <StatusFilterBar value={filter} onChange={setFilter} counts={filterCounts} />

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(51,65,85,0.5)' }}>
                {[
                  { key: 'category' as const, label: '카테고리' },
                  { key: 'prev' as const, label: formatMonthLabel(result.month1.label) },
                  { key: 'curr' as const, label: formatMonthLabel(result.month2.label) },
                  { key: 'diff' as const, label: '증감액' },
                  { key: 'status' as const, label: '상태' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== 'status' && handleSort(col.key as DetailSortKey)}
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
                    <ExpandedDetailRow
                      prevItems={item.prevItems}
                      currItems={item.currItems}
                      prevLabel={formatMonthLabel(result.month1.label)}
                      currLabel={formatMonthLabel(result.month2.label)}
                      colSpan={6}
                    />
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
