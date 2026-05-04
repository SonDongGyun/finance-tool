import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function getInitialIsMobile() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

// matchMedia fires only when the breakpoint is crossed, so this is cheaper
// than a resize listener and avoids needing a debounce.
export function useWindowSize() {
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { isMobile };
}
