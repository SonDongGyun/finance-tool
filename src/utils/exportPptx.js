import PptxGenJS from 'pptxgenjs';
import { formatMoney, formatMonthLabel } from './excelParser';

const STATUS_KR = { new: '신규', removed: '제거', increased: '증가', decreased: '감소', unchanged: '동일' };
const BG = '0F172A';
const TEXT = 'E2E8F0';
const SUB = '94A3B8';
const BLUE = '3B82F6';
const PURPLE = '8B5CF6';
const RED = 'EF4444';
const GREEN = '10B981';
const ORANGE = 'F97316';
const CYAN = '06B6D4';

export function exportPptx(result) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Davichi Finance Tool';

  const m1 = formatMonthLabel(result.month1.label);
  const m2 = formatMonthLabel(result.month2.label);

  // ═══════════ Slide 1: Title ═══════════
  const s1 = pptx.addSlide();
  s1.background = { color: BG };

  s1.addText('Monthly Cost Analysis', {
    x: 0.8, y: 1.2, w: 11.5, h: 0.8,
    fontSize: 36, fontFace: 'Arial', color: TEXT, bold: true,
  });
  s1.addText(`${m1}  vs  ${m2}`, {
    x: 0.8, y: 2.0, w: 11.5, h: 0.6,
    fontSize: 22, fontFace: 'Arial', color: BLUE,
  });
  s1.addText(`Davichi Finance Team  |  ${new Date().toLocaleDateString('ko-KR')}`, {
    x: 0.8, y: 2.8, w: 11.5, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: SUB,
  });

  // Decorative line
  s1.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 3.4, w: 3, h: 0.06,
    fill: { color: BLUE },
  });

  // ═══════════ Slide 2: Summary ═══════════
  const s2 = pptx.addSlide();
  s2.background = { color: BG };

  s2.addText('Overview', {
    x: 0.8, y: 0.4, w: 5, h: 0.6,
    fontSize: 24, fontFace: 'Arial', color: TEXT, bold: true,
  });

  // Summary cards
  const cards = [
    { label: m1, value: `${formatMoney(result.month1.total)}won`, sub: `${result.month1.count} items`, color: '475569' },
    { label: m2, value: `${formatMoney(result.month2.total)}won`, sub: `${result.month2.count} items`, color: BLUE },
    { label: 'Diff', value: `${result.totalDiff >= 0 ? '+' : ''}${formatMoney(result.totalDiff)}won`, sub: `${result.totalPctChange >= 0 ? '+' : ''}${result.totalPctChange}%`, color: result.totalDiff >= 0 ? RED : GREEN },
  ];

  cards.forEach((c, i) => {
    const x = 0.8 + i * 3.6;
    s2.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 3.2, h: 1.6,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
      rectRadius: 0.15,
    });
    s2.addText(c.label, { x, y: 1.45, w: 3.2, h: 0.35, fontSize: 11, color: SUB, align: 'center', fontFace: 'Arial' });
    s2.addText(c.value, { x, y: 1.75, w: 3.2, h: 0.5, fontSize: 20, color: TEXT, bold: true, align: 'center', fontFace: 'Arial' });
    s2.addText(c.sub, { x, y: 2.3, w: 3.2, h: 0.35, fontSize: 12, color: c.color, align: 'center', fontFace: 'Arial' });
  });

  // Change counts
  const changes = [
    { label: 'New', count: result.newItems.length, color: BLUE },
    { label: 'Removed', count: result.removedItems.length, color: ORANGE },
    { label: 'Increased', count: result.increasedItems.length, color: RED },
    { label: 'Decreased', count: result.decreasedItems.length, color: GREEN },
  ];

  changes.forEach((c, i) => {
    const x = 0.8 + i * 2.8;
    s2.addShape(pptx.ShapeType.roundRect, {
      x, y: 3.3, w: 2.5, h: 1.2,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
      rectRadius: 0.12,
    });
    s2.addText(c.label, { x, y: 3.4, w: 2.5, h: 0.4, fontSize: 10, color: c.color, align: 'center', fontFace: 'Arial' });
    s2.addText(String(c.count), { x, y: 3.8, w: 2.5, h: 0.55, fontSize: 28, color: TEXT, bold: true, align: 'center', fontFace: 'Arial' });
  });

  // ═══════════ Slide 3: Analysis Summary ═══════════
  const s3 = pptx.addSlide();
  s3.background = { color: BG };
  s3.addText('Analysis Summary', {
    x: 0.8, y: 0.4, w: 5, h: 0.6,
    fontSize: 24, fontFace: 'Arial', color: TEXT, bold: true,
  });

  const lines = [];
  if (result.totalDiff > 0) {
    lines.push({ color: RED, text: `Total cost increased by ${formatMoney(result.totalDiff)}won (${result.totalPctChange > 0 ? '+' : ''}${result.totalPctChange}%) from ${m1} to ${m2}.` });
  } else if (result.totalDiff < 0) {
    lines.push({ color: GREEN, text: `Total cost decreased by ${formatMoney(Math.abs(result.totalDiff))}won (${result.totalPctChange}%) from ${m1} to ${m2}.` });
  }

  result.newItems.forEach(item => {
    lines.push({ color: BLUE, text: `[NEW] ${item.category}: ${formatMoney(item.currAmount)}won in ${m2}.` });
  });
  result.removedItems.forEach(item => {
    lines.push({ color: ORANGE, text: `[REMOVED] ${item.category}: ${formatMoney(item.prevAmount)}won was in ${m1}, none in ${m2}.` });
  });
  result.increasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).forEach(item => {
    lines.push({ color: RED, text: `[+] ${item.category}: ${formatMoney(item.prevAmount)} → ${formatMoney(item.currAmount)}won (+${formatMoney(item.diff)}won, +${item.pctChange}%)` });
  });
  result.decreasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).forEach(item => {
    lines.push({ color: GREEN, text: `[-] ${item.category}: ${formatMoney(item.prevAmount)} → ${formatMoney(item.currAmount)}won (-${formatMoney(Math.abs(item.diff))}won, ${item.pctChange}%)` });
  });

  // Max ~12 lines per slide
  const maxLines = 12;
  const linePages = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    linePages.push(lines.slice(i, i + maxLines));
  }

  linePages.forEach((page, pageIdx) => {
    const slide = pageIdx === 0 ? s3 : pptx.addSlide();
    if (pageIdx > 0) {
      slide.background = { color: BG };
      slide.addText(`Analysis Summary (${pageIdx + 1})`, {
        x: 0.8, y: 0.4, w: 5, h: 0.6,
        fontSize: 24, fontFace: 'Arial', color: TEXT, bold: true,
      });
    }

    page.forEach((line, i) => {
      const yPos = 1.2 + i * 0.36;
      // Dot
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 0.9, y: yPos + 0.1, w: 0.12, h: 0.12,
        fill: { color: line.color },
      });
      slide.addText(line.text, {
        x: 1.2, y: yPos, w: 11, h: 0.34,
        fontSize: 11, fontFace: 'Arial', color: 'CBD5E1',
      });
    });
  });

  // ═══════════ Slide: Category Table ═══════════
  const catRows = result.categoryComparison.map(c => [
    { text: c.category, options: { fontSize: 9, color: TEXT, fontFace: 'Arial' } },
    { text: `${formatMoney(c.prevAmount)}`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: 'Arial' } },
    { text: `${formatMoney(c.currAmount)}`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: 'Arial' } },
    { text: `${c.diff >= 0 ? '+' : ''}${formatMoney(c.diff)}`, options: { fontSize: 9, color: c.diff > 0 ? RED : c.diff < 0 ? GREEN : SUB, align: 'right', bold: true, fontFace: 'Arial' } },
    { text: STATUS_KR[c.status], options: { fontSize: 9, color: c.status === 'new' ? BLUE : c.status === 'removed' ? ORANGE : c.status === 'increased' ? RED : c.status === 'decreased' ? GREEN : SUB, align: 'center', fontFace: 'Arial' } },
  ]);

  // Split into pages of 14 rows
  const rowsPerPage = 14;
  for (let i = 0; i < catRows.length; i += rowsPerPage) {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    slide.addText(i === 0 ? 'Category Comparison' : `Category Comparison (${Math.floor(i / rowsPerPage) + 1})`, {
      x: 0.8, y: 0.3, w: 8, h: 0.5,
      fontSize: 22, fontFace: 'Arial', color: TEXT, bold: true,
    });

    const headerRow = [
      { text: 'Category', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, fontFace: 'Arial' } },
      { text: m1, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: 'Arial' } },
      { text: m2, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: 'Arial' } },
      { text: 'Diff', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: 'Arial' } },
      { text: 'Status', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'center', fontFace: 'Arial' } },
    ];

    const chunk = catRows.slice(i, i + rowsPerPage);
    const tableRows = [headerRow, ...chunk.map((row, idx) => row.map(cell => ({
      ...cell,
      options: { ...cell.options, fill: { color: idx % 2 === 0 ? '1E293B' : '172033' } },
    })))];

    slide.addTable(tableRows, {
      x: 0.5, y: 1.0, w: 12.0,
      colW: [4, 2, 2, 2, 2],
      border: { type: 'solid', pt: 0.5, color: '334155' },
      rowH: 0.33,
    });
  }

  // ═══════════ Slide: Vendor Table ═══════════
  if (result.vendorComparison.length > 0) {
    const vendorRows = result.vendorComparison.map(v => [
      { text: v.vendor, options: { fontSize: 9, color: TEXT, fontFace: 'Arial' } },
      { text: `${formatMoney(v.prevAmount)}`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: 'Arial' } },
      { text: `${formatMoney(v.currAmount)}`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: 'Arial' } },
      { text: `${v.diff >= 0 ? '+' : ''}${formatMoney(v.diff)}`, options: { fontSize: 9, color: v.diff > 0 ? RED : GREEN, align: 'right', bold: true, fontFace: 'Arial' } },
    ]);

    for (let i = 0; i < vendorRows.length; i += rowsPerPage) {
      const slide = pptx.addSlide();
      slide.background = { color: BG };
      slide.addText(i === 0 ? 'Vendor Changes' : `Vendor Changes (${Math.floor(i / rowsPerPage) + 1})`, {
        x: 0.8, y: 0.3, w: 8, h: 0.5,
        fontSize: 22, fontFace: 'Arial', color: TEXT, bold: true,
      });

      const headerRow = [
        { text: 'Vendor', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, fontFace: 'Arial' } },
        { text: m1, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'right', fontFace: 'Arial' } },
        { text: m2, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'right', fontFace: 'Arial' } },
        { text: 'Diff', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'right', fontFace: 'Arial' } },
      ];

      const chunk = vendorRows.slice(i, i + rowsPerPage);
      const tableRows = [headerRow, ...chunk.map((row, idx) => row.map(cell => ({
        ...cell,
        options: { ...cell.options, fill: { color: idx % 2 === 0 ? '1E293B' : '172033' } },
      })))];

      slide.addTable(tableRows, {
        x: 0.5, y: 1.0, w: 12.0,
        colW: [4.5, 2.5, 2.5, 2.5],
        border: { type: 'solid', pt: 0.5, color: '334155' },
        rowH: 0.33,
      });
    }
  }

  pptx.writeFile({ fileName: `analysis_${result.month1.label}_vs_${result.month2.label}.pptx` });
}
