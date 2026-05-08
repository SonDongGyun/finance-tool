import PptxGenJS from 'pptxgenjs';
import { formatMoney, formatMonthLabel } from './formatters';
import type { AnalysisResult, Status } from '../types';

const STATUS_KR: Record<Status, string> = {
  new: '신규',
  removed: '제거',
  increased: '증가',
  decreased: '감소',
  unchanged: '동일',
};
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
const YELLOW = 'F59E0B';
const FONT = 'Malgun Gothic';

type Slide = ReturnType<PptxGenJS['addSlide']>;

function addSlideNumber(slide: Slide, num: number, total: number): void {
  slide.addText(`${num} / ${total}`, {
    x: 11.5, y: 7.0, w: 1.5, h: 0.3,
    fontSize: 8, color: DIM, align: 'right', fontFace: FONT,
  });
}

interface CategorySummaryItem {
  category: string;
  prevAmount: number;
  currAmount: number;
  diff: number;
  pctChange: number;
  status: Status;
  vendorCount: number;
  newVendors: number;
  removedVendors: number;
}

function buildCategorySummary(result: AnalysisResult): CategorySummaryItem[] {
  const categories = [...new Set(result.categoryComparison.map(c => c.category))];
  categories.sort((a, b) => a.localeCompare(b));

  return categories.map(cat => {
    const catItem = result.categoryComparison.find(c => c.category === cat);
    const vendors = result.vendorComparison.filter(v => v.category === cat);
    return {
      category: cat,
      prevAmount: catItem?.prevAmount || 0,
      currAmount: catItem?.currAmount || 0,
      diff: catItem?.diff || 0,
      pctChange: catItem?.pctChange || 0,
      status: catItem?.status || 'unchanged',
      vendorCount: vendors.length,
      newVendors: vendors.filter(v => v.status === 'new').length,
      removedVendors: vendors.filter(v => v.status === 'removed').length,
    };
  });
}

// Shared per-export render context — passed to each slide renderer so
// individual functions don't re-derive labels.
interface PptxContext {
  pptx: PptxGenJS;
  result: AnalysisResult;
  m1: string;
  m2: string;
  today: string;
  diffSign: string;
}

interface InsightLine {
  color: string;
  tag: string;
  text: string;
}

const SLIDE_WIDTH = 13.33;
const TOP_BAR_HEIGHT = 0.08;
const LINES_PER_INSIGHT_SLIDE = 13;
const ROWS_PER_TABLE_SLIDE = 14;

// Common chrome (background + top accent bar) shared by every body slide.
function applyBaseSlideChrome(ctx: PptxContext, slide: Slide): void {
  slide.background = { color: BG };
  slide.addShape(ctx.pptx.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_WIDTH, h: TOP_BAR_HEIGHT, fill: { color: BLUE },
  });
}

function renderCoverSlide(ctx: PptxContext): Slide {
  const { pptx, m1, m2, today } = ctx;
  const slide = pptx.addSlide();
  applyBaseSlideChrome(ctx, slide);

  slide.addText('월별 비용 증감 분석 보고서', {
    x: 0.8, y: 1.5, w: 11.5, h: 0.9,
    fontSize: 36, fontFace: FONT, color: TEXT, bold: true,
  });
  slide.addText(`${m1}  vs  ${m2}`, {
    x: 0.8, y: 2.5, w: 11.5, h: 0.6,
    fontSize: 24, fontFace: FONT, color: BLUE, bold: true,
  });

  slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.4, w: 3.5, h: 0.06, fill: { color: BLUE } });

  slide.addText(today, {
    x: 0.8, y: 3.9, w: 6, h: 0.35,
    fontSize: 11, fontFace: FONT, color: DIM,
  });

  return slide;
}

function renderSummarySlide(ctx: PptxContext): Slide {
  const { pptx, result, m1, m2, diffSign } = ctx;
  const slide = pptx.addSlide();
  applyBaseSlideChrome(ctx, slide);

  slide.addText('요약 개요', {
    x: 0.8, y: 0.3, w: 8, h: 0.6,
    fontSize: 24, fontFace: FONT, color: TEXT, bold: true,
  });

  const cards = [
    { label: m1, value: `${formatMoney(result.month1.total)}`, sub: `${result.month1.count}건`, accent: '475569' },
    { label: m2, value: `${formatMoney(result.month2.total)}`, sub: `${result.month2.count}건`, accent: BLUE },
    { label: '총 증감액', value: `${diffSign}${formatMoney(result.totalDiff)}`, sub: `${diffSign}${result.totalPctChange}%`, accent: result.totalDiff >= 0 ? RED : GREEN },
  ];

  cards.forEach((c, i) => {
    const x = 0.8 + i * 3.8;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.2, w: 3.4, h: 1.8,
      fill: { color: CARD_BG }, line: { color: BORDER, width: 1 }, rectRadius: 0.12,
    });
    slide.addShape(pptx.ShapeType.rect, { x: x + 0.1, y: 1.2, w: 3.2, h: 0.06, fill: { color: c.accent } });
    slide.addText(c.label, { x, y: 1.4, w: 3.4, h: 0.35, fontSize: 11, color: SUB, align: 'center', fontFace: FONT });
    slide.addText(c.value + '원', { x, y: 1.75, w: 3.4, h: 0.55, fontSize: 20, color: TEXT, bold: true, align: 'center', fontFace: FONT });
    slide.addText(c.sub, { x, y: 2.35, w: 3.4, h: 0.35, fontSize: 13, color: c.accent, align: 'center', bold: true, fontFace: FONT });
  });

  const changes = [
    { label: '신규 항목', count: result.newItems.length, color: BLUE },
    { label: '제거 항목', count: result.removedItems.length, color: ORANGE },
    { label: '증가 항목', count: result.increasedItems.length, color: RED },
    { label: '감소 항목', count: result.decreasedItems.length, color: GREEN },
  ];

  changes.forEach((c, i) => {
    const x = 0.8 + i * 2.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 3.4, w: 2.6, h: 1.3,
      fill: { color: CARD_BG }, line: { color: BORDER, width: 1 }, rectRadius: 0.1,
    });
    slide.addText(c.label, { x, y: 3.5, w: 2.6, h: 0.35, fontSize: 10, color: c.color, align: 'center', fontFace: FONT });
    slide.addText(String(c.count), { x, y: 3.9, w: 2.6, h: 0.65, fontSize: 30, color: TEXT, bold: true, align: 'center', fontFace: FONT });
  });

  // 핵심 인사이트 박스
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 5.1, w: 11.5, h: 1.4,
    fill: { color: '1A1A2E' }, line: { color: YELLOW, width: 1 }, rectRadius: 0.1,
  });
  slide.addText('핵심 인사이트', {
    x: 1.2, y: 5.2, w: 3, h: 0.35,
    fontSize: 11, color: YELLOW, bold: true, fontFace: FONT,
  });

  const insights: string[] = [];
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

  slide.addText(insights.join('\n'), {
    x: 1.2, y: 5.55, w: 10.8, h: 0.85,
    fontSize: 10, color: 'CBD5E1', fontFace: FONT, lineSpacing: 18,
  });

  return slide;
}

function buildInsightLines(ctx: PptxContext): InsightLine[] {
  const { result, m1, m2, diffSign } = ctx;
  const lines: InsightLine[] = [];

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

  return lines;
}

function renderInsightLineSlides(ctx: PptxContext): Slide[] {
  const { pptx } = ctx;
  const lines = buildInsightLines(ctx);
  const slides: Slide[] = [];

  for (let i = 0; i < lines.length; i += LINES_PER_INSIGHT_SLIDE) {
    const slide = pptx.addSlide();
    slides.push(slide);
    applyBaseSlideChrome(ctx, slide);

    slide.addText(i === 0 ? '분석 상세' : '분석 상세 (계속)', {
      x: 0.8, y: 0.3, w: 8, h: 0.6,
      fontSize: 24, fontFace: FONT, color: TEXT, bold: true,
    });

    const page = lines.slice(i, i + LINES_PER_INSIGHT_SLIDE);
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

  return slides;
}

function renderCategoryTableSlides(ctx: PptxContext, catSummary: CategorySummaryItem[]): Slide[] {
  const { pptx, m1, m2 } = ctx;
  const slides: Slide[] = [];

  const catRows = catSummary.map(c => [
    { text: c.category, options: { fontSize: 9, color: TEXT, fontFace: FONT } },
    { text: `${formatMoney(c.prevAmount)}원`, options: { fontSize: 9, color: 'CBD5E1', align: 'right' as const, fontFace: FONT } },
    { text: `${formatMoney(c.currAmount)}원`, options: { fontSize: 9, color: 'CBD5E1', align: 'right' as const, fontFace: FONT } },
    { text: `${c.diff >= 0 ? '+' : ''}${formatMoney(c.diff)}원`, options: { fontSize: 9, color: c.diff > 0 ? RED : c.diff < 0 ? GREEN : SUB, align: 'right' as const, bold: true, fontFace: FONT } },
    { text: `${c.pctChange >= 0 ? '+' : ''}${c.pctChange}%`, options: { fontSize: 9, color: c.diff > 0 ? RED : c.diff < 0 ? GREEN : SUB, align: 'right' as const, fontFace: FONT } },
    { text: STATUS_KR[c.status], options: { fontSize: 9, color: c.status === 'new' ? BLUE : c.status === 'removed' ? ORANGE : c.status === 'increased' ? RED : c.status === 'decreased' ? GREEN : SUB, align: 'center' as const, bold: true, fontFace: FONT } },
    { text: c.vendorCount > 0 ? `${c.vendorCount}건 (신규${c.newVendors} 제거${c.removedVendors})` : '-', options: { fontSize: 8, color: SUB, align: 'center' as const, fontFace: FONT } },
  ]);

  for (let i = 0; i < catRows.length; i += ROWS_PER_TABLE_SLIDE) {
    const slide = pptx.addSlide();
    slides.push(slide);
    applyBaseSlideChrome(ctx, slide);

    slide.addText(i === 0 ? '계정과목별 총평' : '계정과목별 총평 (계속)', {
      x: 0.8, y: 0.3, w: 8, h: 0.5,
      fontSize: 22, fontFace: FONT, color: TEXT, bold: true,
    });

    const headerRow = [
      { text: '계정과목', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, fontFace: FONT } },
      { text: m1, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right' as const, fontFace: FONT } },
      { text: m2, options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right' as const, fontFace: FONT } },
      { text: '증감액', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right' as const, fontFace: FONT } },
      { text: '증감률', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'right' as const, fontFace: FONT } },
      { text: '상태', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'center' as const, fontFace: FONT } },
      { text: '거래처 변동', options: { fontSize: 9, bold: true, color: 'FFFFFF', fill: { color: BLUE }, align: 'center' as const, fontFace: FONT } },
    ];

    const chunk = catRows.slice(i, i + ROWS_PER_TABLE_SLIDE);
    const tableRows = [headerRow, ...chunk.map((row, idx) => row.map(cell => ({
      ...cell,
      options: { ...cell.options, fill: { color: idx % 2 === 0 ? CARD_BG : '172033' } },
    })))];

    slide.addTable(tableRows, {
      x: 0.5, y: 1.0, w: 12.3,
      colW: [2.8, 1.8, 1.8, 1.8, 1.1, 1.2, 1.8],
      border: { type: 'solid', pt: 0.5, color: BORDER },
      rowH: 0.33,
    });
  }

  return slides;
}

function renderClosingSlide(ctx: PptxContext): Slide {
  const { pptx, today } = ctx;
  const slide = pptx.addSlide();
  applyBaseSlideChrome(ctx, slide);

  slide.addText('감사합니다', {
    x: 0, y: 2.5, w: SLIDE_WIDTH, h: 1,
    fontSize: 36, fontFace: FONT, color: TEXT, bold: true, align: 'center',
  });
  slide.addText('재무 분석 툴', {
    x: 0, y: 3.5, w: SLIDE_WIDTH, h: 0.5,
    fontSize: 14, fontFace: FONT, color: SUB, align: 'center',
  });
  slide.addText(today, {
    x: 0, y: 4.1, w: SLIDE_WIDTH, h: 0.4,
    fontSize: 11, fontFace: FONT, color: DIM, align: 'center',
  });

  return slide;
}

export async function exportPptx(result: AnalysisResult): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.subject = '월별 비용 증감 분석';

  const ctx: PptxContext = {
    pptx,
    result,
    m1: formatMonthLabel(result.month1.label),
    m2: formatMonthLabel(result.month2.label),
    today: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    diffSign: result.totalDiff >= 0 ? '+' : '',
  };

  const allSlides: Slide[] = [];
  allSlides.push(renderCoverSlide(ctx));
  allSlides.push(renderSummarySlide(ctx));
  allSlides.push(...renderInsightLineSlides(ctx));
  allSlides.push(...renderCategoryTableSlides(ctx, buildCategorySummary(result)));
  allSlides.push(renderClosingSlide(ctx));

  // 페이지 번호
  allSlides.forEach((slide, i) => {
    addSlideNumber(slide, i + 1, allSlides.length);
  });

  await pptx.writeFile({ fileName: `분석보고서_${result.month1.label}_vs_${result.month2.label}.pptx` });
}
