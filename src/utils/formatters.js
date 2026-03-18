export function formatMoney(amount) {
  if (amount === 0) return '0';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ko-KR');
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  return `${year}년 ${Number(month)}월`;
}
