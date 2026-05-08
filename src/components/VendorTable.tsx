import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/formatters';
import { smoothScrollTo } from '../utils/scroll';
import CategoryTabs from './CategoryTabs';
import StatusBadge from './StatusBadge';
import SearchInput from './SearchInput';
import StatusFilterBar, { type StatusFilterKey, type StatusFilterCounts } from './StatusFilterBar';
import ExpandedDetailRow from './ExpandedDetailRow';
import { cardStyle } from '../styles/common';
import { thStyle, tdStyle, listBtnStyle } from '../styles/table';
import type { AnalysisResult } from '../types';

const DEFAULT_COUNT = 15;
const PAGE_SIZE = 10;

type VendorSortKey = 'category' | 'vendor' | 'prev' | 'curr' | 'diff';
type SortDir = 'asc' | 'desc';

interface VendorTableProps {
  result: AnalysisResult;
}

export default function VendorTable({ result }: VendorTableProps) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_COUNT);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilterKey>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<VendorSortKey>('category');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(result.vendorComparison.map(v => v.category))];
    cats.sort((a, b) => a.localeCompare(b));
    return cats;
  }, [result.vendorComparison]);

  // Counts respect the active category tab (but not the search/status filter
  // itself), matching the previous inline computation.
  const filterCounts = useMemo<StatusFilterCounts>(() => {
    const c: StatusFilterCounts = { new: 0, removed: 0, increased: 0, decreased: 0 };
    result.vendorComparison.forEach(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return;
      if (item.status in c) c[item.status] = (c[item.status] ?? 0) + 1;
    });
    return c;
  }, [result.vendorComparison, selectedCategory]);

  const filtered = useMemo(() => {
    let arr = result.vendorComparison;

    if (selectedCategory !== 'all') {
      arr = arr.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      arr = arr.filter(item =>
        item.vendor.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
      );
    }

    if (filterStatus !== 'all') {
      arr = arr.filter(item => item.status === filterStatus);
    }

    return [...arr].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'category') return mult * a.category.localeCompare(b.category);
      if (sortBy === 'vendor') return mult * a.vendor.localeCompare(b.vendor);
      if (sortBy === 'prev') return mult * (a.prevAmount - b.prevAmount);
      if (sortBy === 'curr') return mult * (a.currAmount - b.currAmount);
      if (sortBy === 'diff') return mult * (Math.abs(a.diff) - Math.abs(b.diff));
      return 0;
    });
  }, [result.vendorComparison, selectedCategory, searchTerm, filterStatus, sortBy, sortDir]);

  if (result.vendorComparison.length === 0) return null;

  const data = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  const handleSort = (col: VendorSortKey) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir(col === 'diff' ? 'desc' : 'asc'); }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(DEFAULT_COUNT);
  };

  const btnStyle = listBtnStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ marginTop: '32px' }}
    >
      <div ref={sectionRef} className="glass" style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ width: '20px', height: '20px', color: '#22d3ee' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>거래처별 변동 내역</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>({filtered.length}건)</span>
          </div>

          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => { setSearchTerm(searchInput); setVisibleCount(DEFAULT_COUNT); }}
            term={searchTerm}
            onClear={() => { setSearchInput(''); setSearchTerm(''); setVisibleCount(DEFAULT_COUNT); }}
            placeholder="거래처 검색 (Enter)"
            ariaLabel="거래처 검색 (엔터로 적용)"
            width={220}
          />
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          categories={categories}
          selected={selectedCategory}
          onSelect={handleCategoryChange}
        />

        {/* Status Filters */}
        <StatusFilterBar
          value={filterStatus}
          onChange={(k) => { setFilterStatus(k); setVisibleCount(DEFAULT_COUNT); }}
          counts={filterCounts}
          size="compact"
          marginBottom={20}
        />

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(51,65,85,0.5)' }}>
                {[
                  ...(selectedCategory === 'all' ? [{ key: 'category' as const, label: '계정과목', align: 'left' as const }] : []),
                  { key: 'vendor' as const, label: '거래처', align: 'left' as const },
                  { key: 'prev' as const, label: '이전', align: 'right' as const },
                  { key: 'curr' as const, label: '현재', align: 'right' as const },
                  { key: 'diff' as const, label: '증감', align: 'right' as const },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={thStyle(true, col.align)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {sortBy === col.key && (
                        sortDir === 'asc'
                          ? <ChevronUp style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                          : <ChevronDown style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                      )}
                    </span>
                  </th>
                ))}
                <th style={{ ...thStyle(false, 'center'), width: '80px' }}>상태</th>
                <th style={{ ...thStyle(false, 'center'), width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => {
                const rowKey = `${item.category}-${item.vendor}`;
                const isExpanded = expandedRow === rowKey;
                const colSpan = (selectedCategory === 'all' ? 1 : 0) + 6;
                return (
                  <React.Fragment key={rowKey}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                      style={{
                        borderBottom: '1px solid rgba(30,41,59,0.5)',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {selectedCategory === 'all' && (
                        <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.category}
                        </td>
                      )}
                      <td style={{ ...tdStyle, color: '#e2e8f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.vendor}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#cbd5e1' }}>
                        {item.prevAmount > 0 ? `${formatMoney(item.prevAmount)}원` : '-'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#cbd5e1' }}>
                        {item.currAmount > 0 ? `${formatMoney(item.currAmount)}원` : '-'}
                      </td>
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600,
                        color: item.diff > 0 ? '#f87171' : '#34d399',
                      }}>
                        {item.diff > 0 ? '+' : ''}{formatMoney(item.diff)}원
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <StatusBadge status={item.status} variant="compact" />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <ChevronDown style={{
                          width: '16px', height: '16px', color: '#64748b',
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }} />
                      </td>
                    </motion.tr>
                    {isExpanded && (
                      <ExpandedDetailRow
                        prevItems={item.prevItems ?? []}
                        currItems={item.currItems ?? []}
                        prevLabel={formatMonthLabel(result.month1.label)}
                        currLabel={formatMonthLabel(result.month2.label)}
                        colSpan={colSpan}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {data.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: '14px' }}>
              해당하는 항목이 없습니다
            </div>
          )}
        </div>

        {/* Show more / less buttons */}
        {(remaining > 0 || visibleCount > DEFAULT_COUNT) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            {remaining > 0 && (
              <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} style={btnStyle}>
                <ChevronDown style={{ width: '14px', height: '14px' }} />
                +{Math.min(remaining, PAGE_SIZE)}건 더보기
              </button>
            )}
            {remaining > 0 && (
              <button onClick={() => setVisibleCount(filtered.length)} style={btnStyle}>
                전체보기 ({filtered.length}건)
              </button>
            )}
            {visibleCount > DEFAULT_COUNT && (
              <button onClick={() => { setVisibleCount(DEFAULT_COUNT); smoothScrollTo(sectionRef); }} style={btnStyle}>
                <ChevronDown style={{ width: '14px', height: '14px', transform: 'rotate(180deg)' }} />
                접기
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
