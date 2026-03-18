import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, formatMonthLabel } from './excelParser';

const STATUS_KR = { new: '신규', removed: '제거', increased: '증가', decreased: '감소', unchanged: '동일' };

export function exportPdf(result) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const m1 = formatMonthLabel(result.month1.label);
  const m2 = formatMonthLabel(result.month2.label);
  const pageW = doc.internal.pageSize.getWidth();
  let y = 18;

  // ── Title ──
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(`${m1} vs ${m2}  Monthly Cost Analysis`, pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}`, pageW / 2, y, { align: 'center' });
  y += 10;

  // ── Summary Cards ──
  const cardData = [
    [m1, `${formatMoney(result.month1.total)} won`, `${result.month1.count} items`],
    [m2, `${formatMoney(result.month2.total)} won`, `${result.month2.count} items`],
    ['Diff', `${result.totalDiff >= 0 ? '+' : ''}${formatMoney(result.totalDiff)} won`, `${result.totalPctChange >= 0 ? '+' : ''}${result.totalPctChange}%`],
  ];

  const cardW = 80;
  const cardGap = 10;
  const startX = (pageW - (cardW * 3 + cardGap * 2)) / 2;

  cardData.forEach((card, i) => {
    const x = startX + i * (cardW + cardGap);
    const bgColor = i === 0 ? [100, 116, 139] : i === 1 ? [59, 130, 246] : (result.totalDiff >= 0 ? [239, 68, 68] : [16, 185, 129]);

    doc.setFillColor(...bgColor);
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.text(card[0], x + cardW / 2, y + 7, { align: 'center' });
    doc.setFontSize(13);
    doc.text(card[1], x + cardW / 2, y + 14, { align: 'center' });
    doc.setFontSize(8);
    doc.text(card[2], x + cardW / 2, y + 19, { align: 'center' });
  });

  y += 30;

  // ── Change Summary ──
  const summaryRow = [
    ['New', result.newItems.length],
    ['Removed', result.removedItems.length],
    ['Increased', result.increasedItems.length],
    ['Decreased', result.decreasedItems.length],
  ];
  const sCardW = 55;
  const sStartX = (pageW - (sCardW * 4 + 6 * 3)) / 2;
  summaryRow.forEach((s, i) => {
    const x = sStartX + i * (sCardW + 6);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, sCardW, 14, 2, 2, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.text(s[0], x + sCardW / 2, y + 5, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(String(s[1]), x + sCardW / 2, y + 12, { align: 'center' });
  });

  y += 22;

  // ── Category Detail Table ──
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Category Comparison', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Category', m1, m2, 'Diff', '%', 'Status']],
    body: result.categoryComparison.map(c => [
      c.category,
      `${formatMoney(c.prevAmount)} won`,
      `${formatMoney(c.currAmount)} won`,
      `${c.diff >= 0 ? '+' : ''}${formatMoney(c.diff)} won`,
      `${c.pctChange >= 0 ? '+' : ''}${c.pctChange}%`,
      STATUS_KR[c.status] || c.status,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = result.categoryComparison[data.row.index]?.diff;
        if (val > 0) data.cell.styles.textColor = [220, 38, 38];
        else if (val < 0) data.cell.styles.textColor = [5, 150, 105];
      }
      if (data.section === 'body' && data.column.index === 5) {
        const status = result.categoryComparison[data.row.index]?.status;
        if (status === 'new') data.cell.styles.textColor = [59, 130, 246];
        else if (status === 'removed') data.cell.styles.textColor = [234, 88, 12];
        else if (status === 'increased') data.cell.styles.textColor = [220, 38, 38];
        else if (status === 'decreased') data.cell.styles.textColor = [5, 150, 105];
      }
    },
  });

  // ── Vendor Table (new page) ──
  if (result.vendorComparison.length > 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Vendor Changes', 14, 18);

    autoTable(doc, {
      startY: 22,
      head: [['Vendor', m1, m2, 'Diff', 'Status']],
      body: result.vendorComparison.map(v => [
        v.vendor,
        `${formatMoney(v.prevAmount)} won`,
        `${formatMoney(v.currAmount)} won`,
        `${v.diff >= 0 ? '+' : ''}${formatMoney(v.diff)} won`,
        STATUS_KR[v.status] || v.status,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = result.vendorComparison[data.row.index]?.diff;
          if (val > 0) data.cell.styles.textColor = [220, 38, 38];
          else if (val < 0) data.cell.styles.textColor = [5, 150, 105];
        }
      },
    });
  }

  doc.save(`analysis_${result.month1.label}_vs_${result.month2.label}.pdf`);
}
