export function formatMoney(amount: number): string {
  if (amount === 0) return '0';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ko-KR');
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatMonthLabel(monthKey: string | null | undefined): string {
  if (!monthKey) return '';
  if (monthKey.includes('~')) {
    const [start, end] = monthKey.split('~');
    const [sy, sm] = start.split('-');
    const [ey, em] = end.split('-');
    if (sy === ey) {
      return `${sy}년 ${Number(sm)}~${Number(em)}월`;
    }
    return `${sy}년 ${Number(sm)}월 ~ ${ey}년 ${Number(em)}월`;
  }
  const [year, month] = monthKey.split('-');
  return `${year}년 ${Number(month)}월`;
}

export function expandMonthRange(startKey: string, endKey: string): string[] {
  if (!startKey || !endKey) return [];
  const [sy, sm] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  const startIdx = sy * 12 + (sm - 1);
  const endIdx = ey * 12 + (em - 1);
  const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
  const out: string[] = [];
  for (let i = from; i <= to; i++) {
    const y = Math.floor(i / 12);
    const m = (i % 12) + 1;
    out.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return out;
}

export function buildRangeKey(startKey: string, endKey: string): string {
  if (!startKey || !endKey) return '';
  if (startKey === endKey) return startKey;
  const [sy, sm] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  const startIdx = sy * 12 + (sm - 1);
  const endIdx = ey * 12 + (em - 1);
  return startIdx <= endIdx ? `${startKey}~${endKey}` : `${endKey}~${startKey}`;
}

export function monthRangesOverlap(
  monthsA: string[] | null | undefined,
  monthsB: string[] | null | undefined,
): boolean {
  if (!Array.isArray(monthsA) || !Array.isArray(monthsB)) return false;
  const set = new Set(monthsA);
  return monthsB.some(m => set.has(m));
}
