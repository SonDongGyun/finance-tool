import { useRef, useEffect, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '7px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  border: active ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(100,116,139,0.2)',
  background: active ? 'rgba(34,211,238,0.12)' : 'rgba(15,23,42,0.4)',
  color: active ? '#22d3ee' : '#94a3b8',
  cursor: 'pointer',
  flexShrink: 0,
});

// disabled state shows the button greyed-out so users still see the affordance
// (and the layout doesn't shift) when they've scrolled to the edge.
const navBtnStyle = (disabled: boolean): CSSProperties => ({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'rgba(15,23,42,0.9)',
  border: '1px solid rgba(100,116,139,0.3)',
  color: '#cbd5e1',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.3 : 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  padding: 0,
});

interface CategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // True iff the tab strip is wider than its viewport, i.e. nav buttons are useful.
  // Tracked separately from canScrollLeft/Right so the buttons stay mounted as
  // the user scrolls (just toggling disabled state) — no layout shift.
  const [needsScroll, setNeedsScroll] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 1;
    setNeedsScroll(overflows);
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [categories]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  const scrollToEdge = (edge: 'start' | 'end') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: edge === 'start' ? 0 : el.scrollWidth, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      {needsScroll && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => scrollToEdge('start')}
            disabled={!canScrollLeft}
            aria-label="맨 앞으로"
            style={navBtnStyle(!canScrollLeft)}
          >
            <ChevronsLeft style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="이전"
            style={navBtnStyle(!canScrollLeft)}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '2px 0',
        }}
      >
        <button
          onClick={() => onSelect('all')}
          style={tabStyle(selected === 'all')}
        >
          전체
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            style={tabStyle(selected === cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {needsScroll && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="다음"
            style={navBtnStyle(!canScrollRight)}
          >
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            type="button"
            onClick={() => scrollToEdge('end')}
            disabled={!canScrollRight}
            aria-label="맨 끝으로"
            style={navBtnStyle(!canScrollRight)}
          >
            <ChevronsRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}
    </div>
  );
}
