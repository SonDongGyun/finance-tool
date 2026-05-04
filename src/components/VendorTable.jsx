import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../utils/formatters';
import { smoothScrollTo } from '../utils/scroll';
import CategoryTabs from './CategoryTabs';
import StatusBadge from './StatusBadge';
import SearchInput from './SearchInput';

const DEFAULT_COUNT = 15;
const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'removed', label: '제거' },
  { key: 'increased', label: '증가' },
  { key: 'decreased', label: '감소' },
];

export default function VendorTable({ result }) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_COUNT);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('category');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);
  const sectionRef = useRef(null);

  const categories = useMemo(() => {
    const cats = [...new Set(result.vendorComparison.map(v => v.category))];
    cats.sort((a, b) => a.localeCompare(b));
    return cats;
  }, [result.vendorComparison]);

  const filtered = useMemo(() => {
    let arr = result.vendorComparison;

    if (selectedCategory !== 'all') {
      arr = arr.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      arr = arr.filter(item =>
        item.vendor.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
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

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir(col === 'diff' ? 'desc' : 'asc'); }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setVisibleCount(DEFAULT_COUNT);
  };

  const thStyle = (clickable) => ({
    padding: '14px 16px',
    fontSize: '12px', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    cursor: clickable ? 'pointer' : 'default',
    userSelect: 'none',
  });

  const tdStyle = {
    padding: '14px 16px', fontSize: '14px',
  };

  const btnStyle = {
    padding: '10px 16px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, flex: 1,
    background: 'rgba(100,116,139,0.1)', color: '#94a3b8',
    border: '1px solid rgba(100,116,139,0.15)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '6px',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ marginTop: '32px' }}
    >
      <div ref={sectionRef} className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilterStatus(f.key); setVisibleCount(DEFAULT_COUNT); }}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                border: filterStatus === f.key ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(100,116,139,0.2)',
                background: filterStatus === f.key ? 'rgba(59,130,246,0.15)' : 'rgba(15,23,42,0.4)',
                color: filterStatus === f.key ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '11px' }}>
                  {result.vendorComparison.filter(c => c.status === f.key && (selectedCategory === 'all' || c.category === selectedCategory)).length}
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
                  ...(selectedCategory === 'all' ? [{ key: 'category', label: '계정과목', align: 'left' }] : []),
                  { key: 'vendor', label: '거래처', align: 'left' },
                  { key: 'prev', label: '이전', align: 'right' },
                  { key: 'curr', label: '현재', align: 'right' },
                  { key: 'diff', label: '증감', align: 'right' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ ...thStyle(true), textAlign: col.align }}
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
                <th style={{ ...thStyle(false), textAlign: 'center', width: '80px' }}>상태</th>
                <th style={{ ...thStyle(false), textAlign: 'center', width: '40px' }}></th>
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
                      <tr>
                        <td colSpan={colSpan} style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {item.prevItems && item.prevItems.length > 0 && (
                              <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '16px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                                  {formatMonthLabel(result.month1.label)} 상세 ({item.prevItems.length}건)
                                </p>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                  {item.prevItems.map((entry, j) => (
                                    <div key={`prev-${j}-${entry._amount}`} style={{
                                      display: 'flex', justifyContent: 'space-between',
                                      fontSize: '12px', color: '#94a3b8', padding: '6px 0',
                                      borderBottom: '1px solid rgba(51,65,85,0.3)',
                                    }}>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {entry._description || '-'}
                                      </span>
                                      <span style={{ marginLeft: '16px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                                        {formatMoney(entry._amount)}원
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.currItems && item.currItems.length > 0 && (
                              <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '16px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>
                                  {formatMonthLabel(result.month2.label)} 상세 ({item.currItems.length}건)
                                </p>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                  {item.currItems.map((entry, j) => (
                                    <div key={`curr-${j}-${entry._amount}`} style={{
                                      display: 'flex', justifyContent: 'space-between',
                                      fontSize: '12px', color: '#94a3b8', padding: '6px 0',
                                      borderBottom: '1px solid rgba(51,65,85,0.3)',
                                    }}>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {entry._description || '-'}
                                      </span>
                                      <span style={{ marginLeft: '16px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                                        {formatMoney(entry._amount)}원
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
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
