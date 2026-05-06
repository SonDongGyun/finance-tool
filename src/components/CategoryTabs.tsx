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

// Shared visual treatment for the four nav arrows. left/right offsets are
// applied per-button so single (28px) and double (28+4+28=60px) chevrons can
// stack cleanly on each side.
const navBtnStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'rgba(15,23,42,0.9)',
  border: '1px solid rgba(100,116,139,0.3)',
  color: '#cbd5e1',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

interface CategoryTabsProps {
  categories: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
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
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      {canScrollLeft && (
        <>
          <button
            type="button"
            onClick={() => scrollToEdge('start')}
            aria-label="맨 앞으로"
            style={{ ...navBtnStyle, left: 0 }}
          >
            <ChevronsLeft style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="이전"
            style={{ ...navBtnStyle, left: '32px' }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: '6px', overflowX: 'auto',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
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
      {canScrollRight && (
        <>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="다음"
            style={{ ...navBtnStyle, right: '32px' }}
          >
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            type="button"
            onClick={() => scrollToEdge('end')}
            aria-label="맨 끝으로"
            style={{ ...navBtnStyle, right: 0 }}
          >
            <ChevronsRight style={{ width: '16px', height: '16px' }} />
          </button>
        </>
      )}
    </div>
  );
}
