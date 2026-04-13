import PptxGenJS from 'pptxgenjs';
import { formatMoney, formatMonthLabel } from './excelParser';

const STATUS_KR = { new: '신규', removed: '제거', increased: '증가', decreased: '감소', unchanged: '동일' };
const BG = '0F172A';
const CARD_BG = '1E293B';
const BORDER = '334155';
const TEXT = 'E2E8F0';
const SUB = '94A3B8';
const DIM = '64748B';
const BLUE = '3B82F6';
const RED = 'EF4444';
const GREEN = '10B981';
const ORANGE = 'F97316';
const CYAN = '06B6D4';
const YELLOW = 'F59E0B';
const FONT = 'Malgun Gothic';

function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 11.5, y: 7.0, w: 1.5, h: 0.3,
    fontSize: 8, color: DIM, align: 'right', fontFace: FONT,
  });
}

export function exportPptx(result) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '다비치 재무팀';
  pptx.subject = '월별 비용 증감 분석';

  const m1 = formatMonthLabel(result.month1.label);
  const m2 = formatMonthLabel(result.month2.label);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const diffSign = result.totalDiff >= 0 ? '+' : '';
  const allSlides = [];

  // ═══════════ 슬라이드 1: 표지 ═══════════
  const s1 = pptx.addSlide();
  allSlides.push(s1);
  s1.background = { color: BG };
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: BLUE } });

  s1.addText('월별 비용 증감 분석 보고서', {
    x: 0.8, y: 1.5, w: 11.5, h: 0.9,
    fontSize: 36, fontFace: FONT, color: TEXT, bold: true,
  });
  s1.addText(`${m1}  vs  ${m2}`, {
    x: 0.8, y: 2.5, w: 11.5, h: 0.6,
    fontSize: 24, fontFace: FONT, color: BLUE, bold: true,
  });

  s1.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.4, w: 3.5, h: 0.06, fill: { color: BLUE } });

  s1.addText('다비치 재무팀', {
    x: 0.8, y: 3.8, w: 6, h: 0.4,
    fontSize: 14, fontFace: FONT, color: SUB,
  });
  s1.addText(today, {
    x: 0.8, y: 4.2, w: 6, h: 0.35,
    fontSize: 11, fontFace: FONT, color: DIM,
  });

  // ═══════════ 슬라이드 2: 요약 개요 ═══════════
  const s2 = pptx.addSlide();
  allSlides.push(s2);
  s2.background = { color: BG };
  s2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: BLUE } });

  s2.addText('요약 개요', {
    x: 0.8, y: 0.3, w: 8, h: 0.6,
    fontSize: 24, fontFace: FONT, color: TEXT, bold: true,
  });

  // 3 요약 카드
  const cards = [
    { label: m1, value: `${formatMoney(result.month1.total)}`, sub: `${result.month1.count}건`, accent: '475569' },
    { label: m2, value: `${formatMoney(result.month2.total)}`, sub: `${result.month2.count}건`, accent: BLUE },
    { label: '총 증감액', value: `${diffSign}${formatMoney(result.totalDiff)}`, sub: `${diffSign}${result.totalPctChange}%`, accent: result.totalDiff >= 0 ? RED : GREEN },
  ];

  cards.forEach((c, i) => {
    const x = 0.8 + i * 3.8;
    s2.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.2, w: 3.4, h: 1.8,
      fill: { color: CARD_BG }, line: { color: BORDER, width: 1 }, rectRadius: 0.12,
    });
    s2.addShape(pptx.ShapeType.rect, { x: x + 0.1, y: 1.2, w: 3.2, h: 0.06, fill: { color: c.accent } });
    s2.addText(c.label, { x, y: 1.4, w: 3.4, h: 0.35, fontSize: 11, color: SUB, align: 'center', fontFace: FONT });
    s2.addText(c.value + '원', { x, y: 1.75, w: 3.4, h: 0.55, fontSize: 20, color: TEXT, bold: true, align: 'center', fontFace: FONT });
    s2.addText(c.sub, { x, y: 2.35, w: 3.4, h: 0.35, fontSize: 13, color: c.accent, align: 'center', bold: true, fontFace: FONT });
  });

  // 4 변동 카운트 카드
  const changes = [
    { label: '신규 항목', count: result.newItems.length, color: BLUE },
    { label: '제거 항목', count: result.removedItems.length, color: ORANGE },
    { label: '증가 항목', count: result.increasedItems.length, color: RED },
    { label: '감소 항목', count: result.decreasedItems.length, color: GREEN },
  ];

  changes.forEach((c, i) => {
    const x = 0.8 + i * 2.9;
    s2.addShape(pptx.ShapeType.roundRect, {
      x, y: 3.4, w: 2.6, h: 1.3,
      fill: { color: CARD_BG }, line: { color: BORDER, width: 1 }, rectRadius: 0.1,
    });
    s2.addText(c.label, { x, y: 3.5, w: 2.6, h: 0.35, fontSize: 10, color: c.color, align: 'center', fontFace: FONT });
    s2.addText(String(c.count), { x, y: 3.9, w: 2.6, h: 0.65, fontSize: 30, color: TEXT, bold: true, align: 'center', fontFace: FONT });
  });

  // 핵심 인사이트 박스
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 5.1, w: 11.5, h: 1.4,
    fill: { color: '1A1A2E' }, line: { color: YELLOW, width: 1 }, rectRadius: 0.1,
  });
  s2.addText('핵심 인사이트', {
    x: 1.2, y: 5.2, w: 3, h: 0.35,
    fontSize: 11, color: YELLOW, bold: true, fontFace: FONT,
  });

  const insights = [];
  if (result.totalDiff > 0) {
    insights.push(`전월 대비 총 비용이 ${formatMoney(result.totalDiff)}원 증가하였습니다 (${diffSign}${result.totalPctChange}%).`);
  } else if (result.totalDiff < 0) {
    insights.push(`전월 대비 총 비용이 ${formatMoney(Math.abs(result.totalDiff))}원 감소하였습니다 (${result.totalPctChange}%).`);
  }
  if (result.newItems.length > 0) {
    insights.push(`신규 발생 항목: ${result.newItems.map(i => i.category).join(', ')}`);
  }
  if (result.removedItems.length > 0) {
    insights.push(`소멸 항목: ${result.removedItems.map(i => i.category).join(', ')}`);
  }

  s2.addText(insights.join('\n'), {
    x: 1.2, y: 5.55, w: 10.8, h: 0.85,
    fontSize: 10, color: 'CBD5E1', fontFace: FONT, lineSpacing: 18,
  });

  // ═══════════ 슬라이드 3+: 분석 상세 ═══════════
  const lines = [];

  if (result.totalDiff !== 0) {
    const dir = result.totalDiff > 0 ? '증가' : '감소';
    lines.push({ color: BLUE, tag: '총괄', text: `${m1} 대비 ${m2} 총 비용이 ${formatMoney(Math.abs(result.totalDiff))}원 ${dir}하였습니다 (${diffSign}${result.totalPctChange}%).` });
  }

  result.removedItems.forEach(item => {
    lines.push({ color: ORANGE, tag: '제거', text: `${item.category}: ${m1}에 ${formatMoney(item.prevAmount)}원이었으나 ${m2}에는 발생하지 않음.` });
  });
  result.newItems.forEach(item => {
    lines.push({ color: BLUE, tag: '신규', text: `${item.category}: ${m2}에 신규 발생, ${formatMoney(item.currAmount)}원 지출.` });
  });
  result.increasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).forEach(item => {
    lines.push({ color: RED, tag: '증가', text: `${item.category}: ${formatMoney(item.prevAmount)}원 → ${formatMoney(item.currAmount)}원 (+${formatMoney(item.diff)}원, +${item.pctChange}%)` });
  });
  result.decreasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).forEach(item => {
    lines.push({ color: GREEN, tag: '감소', text: `${item.category}: ${formatMoney(item.prevAmount)}원 → ${formatMoney(item.currAmount)}원 (-${formatMoney(Math.abs(item.diff))}원, ${item.pctChange}%)` });
  });

  // 거래처 변동
  result.vendorComparison.forEach(v => {
    const cat = v.category && v.category !== '미분류' ? `[${v.category}] ` : '';
    if (v.status === 'new') {
      lines.push({ color: CYAN, tag: '거래처+', text: `${cat}"${v.vendor}" 신규 거래 발생, ${formatMoney(v.currAmount)}원 지출.` });
    } else if (v.status === 'removed') {
      lines.push({ color: ORANGE, tag: '거래처-', text: `${cat}"${v.vendor}" ${m2} 거래 없음 (전월 ${formatMoney(v.prevAmount)}원).` });
    } else if (v.diff > 0) {
      lines.push({ color: RED, tag: '거래처', text: `${cat}"${v.vendor}" +${formatMoney(v.diff)}원 증가.` });
    } else if (v.diff < 0) {
      lines.push({ color: GREEN, tag: '거래처', text: `${cat}"${v.vendor}" -${formatMoney(Math.abs(v.diff))}원 감소.` });
    }
  });

  const maxLines = 13;
  for (let i = 0; i < lines.length; i += maxLines) {
    const slide = pptx.addSlide();
    allSlides.push(slide);
    slide.background = { color: BG };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: BLUE } });

    slide.addText(i === 0 ? '분석 상세' : '분석 상세 (계속)', {
      x: 0.8, y: 0.3, w: 8, h: 0.6,
      fontSize: 24, fontFace: FONT, color: TEXT, bold: true,
    });

    const page = lines.slice(i, i + maxLines);
    page.forEach((line, idx) => {
      const yPos = 1.2 + idx * 0.42;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: yPos + 0.02, w: 0.85, h: 0.28,
        fill: { color: line.color }, rectRadius: 0.05,
      });
      slide.addText(line.tag, {
        x: 0.8, y: yPos, w: 0.85, h: 0.32,
        fontSize: 7, color: 'FFFFFF', bold: true, align: 'center', fontFace: FONT,
      });
      slide.addText(line.text, {
        x: 1.8, y: yPos, w: 11, h: 0.34,
        fontSize: 11, fontFace: FONT, color: 'CBD5E1',
      });
    });
  }

  // ═══════════ 카테고리별 비교 테이블 ═══════════
  const catRows = result.categoryComparison.map(c => [
    { text: c.category, options: { fontSize: 9, color: TEXT, fontFace: FONT } },
    { text: `${formatMoney(c.prevAmount)}원`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: FONT } },
    { text: `${formatMoney(c.currAmount)}원`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: FONT } },
    { text: `${c.diff >= 0 ? '+' : ''}${formatMoney(c.diff)}원`, options: { fontSize: 9, color: c.diff > 0 ? RED : c.diff < 0 ? GREEN : SUB, align: 'right', bold: true, fontFace: FONT } },
    { text: `${c.pctChange >= 0 ? '+' : ''}${c.pctChange}%`, options: { fontSize: 9, color: c.diff > 0 ? RED : c.diff < 0 ? GREEN : SUB, align: 'right', fontFace: FONT } },
    { text: STATUS_KR[c.status], options: { fontSize: 9, color: c.status === 'new' ? BLUE : c.status === 'removed' ? ORANGE : c.status === 'increased' ? RED : c.status === 'decreased' ? GREEN : SUB, align: 'center', bold: true, fontFace: FONT } },
  ]);

  const rowsPerPage = 14;
  for (let i = 0; i < catRows.length; i += rowsPerPage) {
    const slide = pptx.addSlide();
    allSlides.push(slide);
    slide.background = { color: BG };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: BLUE } });

    slide.addText(i === 0 ? '카테고리별 비교' : '카테고리별 비교 (계속)', {
      x: 0.8, y: 0.3, w: 8, h: 0.5,
      fontSize: 22, fontFace: FONT, color: TEXT, bold: true,
    });

    const headerRow = [
      { text: '카테고리', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, fontFace: FONT } },
      { text: m1, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: FONT } },
      { text: m2, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: FONT } },
      { text: '증감액', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: FONT } },
      { text: '증감률', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right', fontFace: FONT } },
      { text: '상태', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'center', fontFace: FONT } },
    ];

    const chunk = catRows.slice(i, i + rowsPerPage);
    const tableRows = [headerRow, ...chunk.map((row, idx) => row.map(cell => ({
      ...cell,
      options: { ...cell.options, fill: { color: idx % 2 === 0 ? CARD_BG : '172033' } },
    })))];

    slide.addTable(tableRows, {
      x: 0.5, y: 1.0, w: 12.3,
      colW: [3.5, 2, 2, 2, 1.3, 1.5],
      border: { type: 'solid', pt: 0.5, color: BORDER },
      rowH: 0.33,
    });
  }

  // ═══════════ 거래처별 변동 테이블 ═══════════
  if (result.vendorComparison.length > 0) {
    const vendorRows = result.vendorComparison.map(v => [
      { text: v.category || '미분류', options: { fontSize: 9, color: '94A3B8', fontFace: FONT } },
      { text: v.vendor, options: { fontSize: 9, color: TEXT, fontFace: FONT } },
      { text: `${formatMoney(v.prevAmount)}원`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: FONT } },
      { text: `${formatMoney(v.currAmount)}원`, options: { fontSize: 9, color: 'CBD5E1', align: 'right', fontFace: FONT } },
      { text: `${v.diff >= 0 ? '+' : ''}${formatMoney(v.diff)}원`, options: { fontSize: 9, color: v.diff > 0 ? RED : GREEN, align: 'right', bold: true, fontFace: FONT } },
      { text: STATUS_KR[v.status] || '-', options: { fontSize: 9, color: v.status === 'new' ? BLUE : v.status === 'removed' ? ORANGE : v.diff > 0 ? RED : GREEN, align: 'center', bold: true, fontFace: FONT } },
    ]);

    for (let i = 0; i < vendorRows.length; i += rowsPerPage) {
      const slide = pptx.addSlide();
      allSlides.push(slide);
      slide.background = { color: BG };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: CYAN } });

      slide.addText(i === 0 ? '거래처별 변동 내역' : '거래처별 변동 내역 (계속)', {
        x: 0.8, y: 0.3, w: 8, h: 0.5,
        fontSize: 22, fontFace: FONT, color: TEXT, bold: true,
      });

      const headerRow = [
        { text: '계정과목', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, fontFace: FONT } },
        { text: '거래처', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, fontFace: FONT } },
        { text: m1, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'right', fontFace: FONT } },
        { text: m2, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'right', fontFace: FONT } },
        { text: '증감액', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'right', fontFace: FONT } },
        { text: '상태', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: CYAN }, align: 'center', fontFace: FONT } },
      ];

      const chunk = vendorRows.slice(i, i + rowsPerPage);
      const tableRows = [headerRow, ...chunk.map((row, idx) => row.map(cell => ({
        ...cell,
        options: { ...cell.options, fill: { color: idx % 2 === 0 ? CARD_BG : '172033' } },
      })))];

      slide.addTable(tableRows, {
        x: 0.5, y: 1.0, w: 12.3,
        colW: [2.5, 3, 1.8, 1.8, 1.8, 1.4],
        border: { type: 'solid', pt: 0.5, color: BORDER },
        rowH: 0.33,
      });
    }
  }

  // ═══════════ 마지막 슬라이드 ═══════════
  const sEnd = pptx.addSlide();
  allSlides.push(sEnd);
  sEnd.background = { color: BG };
  sEnd.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: BLUE } });

  sEnd.addText('감사합니다', {
    x: 0, y: 2.5, w: 13.33, h: 1,
    fontSize: 36, fontFace: FONT, color: TEXT, bold: true, align: 'center',
  });
  sEnd.addText('다비치 재무팀 분석 툴', {
    x: 0, y: 3.5, w: 13.33, h: 0.5,
    fontSize: 14, fontFace: FONT, color: SUB, align: 'center',
  });
  sEnd.addText(today, {
    x: 0, y: 4.1, w: 13.33, h: 0.4,
    fontSize: 11, fontFace: FONT, color: DIM, align: 'center',
  });

  // 페이지 번호
  allSlides.forEach((slide, i) => {
    addSlideNumber(slide, i + 1, allSlides.length);
  });

  pptx.writeFile({ fileName: `분석보고서_${result.month1.label}_vs_${result.month2.label}.pptx` });
}
