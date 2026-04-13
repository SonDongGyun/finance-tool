import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronDown, Search } from 'lucide-react';
import { formatMoney } from '../utils/excelParser';

const DEFAULT_COUNT = 15;
const PAGE_SIZE = 10;

const statusLabels = {
  new: { label: '신규', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  removed: { label: '제거', color: '#fb923c', bg: 'rgba(249,115,22,0.12)' },
  increased: { label: '증가', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  decreased: { label: '감소', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
};

export default function VendorTable({ result }) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_COUNT);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  if (result.vendorComparison.length === 0) return null;

  let filtered = result.vendorComparison;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.vendor.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  }

  if (filterStatus !== 'all') {
    filtered = filtered.filter(item => item.status === filterStatus);
  }

  const data = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;
  const maxDiff = filtered[0]?.diff ? Math.abs(filtered[0].diff) : 1;

  const filters = [
    { key: 'all', label: '전체' },
    { key: 'new', label: '신규' },
    { key: 'removed', label: '제거' },
    { key: 'increased', label: '증가' },
    { key: 'decreased', label: '감소' },
  ];

  const thStyle = {
    padding: '14px 16px',
    fontSize: '12px', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  };

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
      <div className="glass" style={{ borderRadius: '16px', padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 style={{ width: '20px', height: '20px', color: '#22d3ee' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>거래처별 변동 내역</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>({filtered.length}건)</span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(DEFAULT_COUNT); }}
              placeholder="계정과목 / 거래처 검색..."
              style={{
                paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px',
                borderRadius: '8px', background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(100,116,139,0.3)',
                fontSize: '14px', color: '#e2e8f0', outline: 'none', width: '260px',
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilterStatus(f.key); setVisibleCount(DEFAULT_COUNT); }}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                border: filterStatus === f.key ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(100,116,139,0.2)',
                background: filterStatus === f.key ? 'rgba(59,130,246,0.15)' : 'rgba(15,23,42,0.4)',
                color: filterStatus === f.key ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '12px' }}>
                  {result.vendorComparison.filter(c => c.status === f.key).length}
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
                <th style={{ ...thStyle, textAlign: 'left' }}>계정과목</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>거래처</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>이전</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>현재</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>증감</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>상태</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>변동</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => {
                const st = statusLabels[item.status];
                return (
                  <motion.tr
                    key={`${item.category}-${item.vendor}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      borderBottom: '1px solid rgba(30,41,59,0.5)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.category}
                    </td>
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
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: 600,
                        color: st.color, background: st.bg,
                      }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{
                        width: '100%', maxWidth: '80px', height: '8px',
                        background: 'rgba(15,23,42,0.6)', borderRadius: '4px',
                        overflow: 'hidden', margin: '0 auto',
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (Math.abs(item.diff) / maxDiff) * 100)}%` }}
                          transition={{ duration: 0.8, delay: i * 0.03 }}
                          style={{
                            height: '100%', borderRadius: '4px',
                            background: item.diff > 0 ? '#ef4444' : '#10b981',
                          }}
                        />
                      </div>
                    </td>
                  </motion.tr>
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
        {remaining > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} style={btnStyle}>
              <ChevronDown style={{ width: '14px', height: '14px' }} />
              +{Math.min(remaining, PAGE_SIZE)}건 더보기
            </button>
            <button onClick={() => setVisibleCount(filtered.length)} style={btnStyle}>
              전체보기 ({filtered.length}건)
            </button>
          </div>
        )}
        {visibleCount > DEFAULT_COUNT && remaining <= 0 && filtered.length > DEFAULT_COUNT && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setVisibleCount(DEFAULT_COUNT)}
              style={{ ...btnStyle, flex: 'none', display: 'inline-flex' }}
            >
              <ChevronDown style={{ width: '14px', height: '14px', transform: 'rotate(180deg)' }} />
              접기
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
