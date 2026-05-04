// Smoothly scrolls so the element's top sits ~20px below the viewport top.
// Uses ease-out cubic via requestAnimationFrame so cleanup isn't required —
// the loop ends on its own at duration's end.
export function smoothScrollTo(ref, { offset = 20, duration = 600 } = {}) {
  const el = ref?.current;
  if (!el) return;
  const targetY = el.getBoundingClientRect().top + window.scrollY - offset;
  const startY = window.scrollY;
  const diff = targetY - startY;
  let start = null;
  function step(timestamp) {
    if (start === null) start = timestamp;
    const t = Math.min((timestamp - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, startY + diff * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
