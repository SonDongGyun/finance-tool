import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, formatMonthLabel } from './formatters';
import type { AnalysisResult, Status } from '../types';

const STATUS_KR: Record<Status, string> = {
  new: '신규',
  removed: '제거',
  increased: '증가',
  decreased: '감소',
  unchanged: '동일',
};
const FONT_NAME = 'NanumGothic';

let fontLoadFailed = false;

async function loadKoreanFont(doc: jsPDF): Promise<void> {
  fontLoadFailed = false;
  try {
    const fontUrl = import.meta.env.BASE_URL + 'fonts/NanumGothic-Regular.ttf';
    const res = await fetch(fontUrl);
    if (!res.ok) throw new Error('Font load failed');
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);
    doc.addFileToVFS('NanumGothic.ttf', base64);
    doc.addFont('NanumGothic.ttf', FONT_NAME, 'normal');
  } catch (err) {
    fontLoadFailed = true;
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Korean font loading failed, falling back to Helvetica:', message);
  }
}

function setFont(doc: jsPDF): void {
  if (fontLoadFailed) {
    doc.setFont('Helvetica', 'normal');
  } else {
    doc.setFont(FONT_NAME, 'normal');
  }
}

function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number, m1: string, m2: string): void {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  setFont(doc);
  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text(`재무 분석 보고서  |  ${m1} vs ${m2}`, 14, ph - 8);
  doc.text(`${pageNum} / ${totalPages}`, pw - 14, ph - 8, { align: 'right' });
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, ph - 12, pw - 14, ph - 12);
}

type RGB = [number, number, number];

function addSectionTitle(doc: jsPDF, title: string, y: number, color: RGB = [30, 64, 175]): number {
  setFont(doc);
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(14, y - 1, 4, 7, 'F');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 21, y + 4);
  return y + 12;
}

function newPage(doc: jsPDF): void {
  doc.addPage();
  setFont(doc);
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

// Shared per-export render context — passed to each page renderer so the
// individual functions don't need to re-derive page dimensions or label
// formatting.
interface PdfContext {
  doc: jsPDF;
  result: AnalysisResult;
  m1: string;
  m2: string;
  today: string;
  pw: number;
  ph: number;
  diffSign: string;
}

function renderCoverPage(ctx: PdfContext): void {
  const { doc, result, m1, m2, today, pw, diffSign } = ctx;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pw, 55, 'F');

  setFont(doc);
  doc.setFontSize(28);
  doc.setTextColor(255);
  doc.text('월별 비용 증감 분석 보고서', pw / 2, 25, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(200, 210, 255);
  doc.text(`${m1}  vs  ${m2}`, pw / 2, 38, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(170, 185, 255);
  doc.text(`작성일: ${today}`, pw / 2, 48, { align: 'center' });

  // 요약 개요 박스
  const y = 70;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y - 4, pw - 28, 50, 3, 3, 'F');

  setFont(doc);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text('요약 개요', 20, y + 3);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryText = [
    `${m1} 총 비용: ${formatMoney(result.month1.total)}원 (${result.month1.count}건)`,
    `${m2} 총 비용: ${formatMoney(result.month2.total)}원 (${result.month2.count}건)`,
    `총 증감액: ${diffSign}${formatMoney(result.totalDiff)}원 (${diffSign}${result.totalPctChange}%)`,
    '',
    `신규 항목 ${result.newItems.length}건  |  제거 항목 ${result.removedItems.length}건  |  증가 항목 ${result.increasedItems.length}건  |  감소 항목 ${result.decreasedItems.length}건`,
  ];
  summaryText.forEach((t, i) => {
    doc.text(t, 20, y + 12 + i * 7);
  });
}

function renderInsightsPage(ctx: PdfContext): void {
  const { doc, result, m1, m2, pw, ph, diffSign } = ctx;

  newPage(doc);
  let y = 18;
  y = addSectionTitle(doc, '핵심 인사이트', y, [180, 120, 0]);

  const maxTextW = pw - 48;
  const lineH = 5.5;

  const insightItems: string[] = [];

  if (result.totalDiff > 0) {
    insightItems.push(`전월 대비 총 비용이 ${formatMoney(result.totalDiff)}원 증가하였습니다 (${diffSign}${result.totalPctChange}%).`);
  } else if (result.totalDiff < 0) {
    insightItems.push(`전월 대비 총 비용이 ${formatMoney(Math.abs(result.totalDiff))}원 감소하였습니다 (${result.totalPctChange}%).`);
  }
  if (result.newItems.length > 0) {
    result.newItems.forEach(i => {
      insightItems.push(`[신규] ${i.category}: ${m2}에 신규 발생, ${formatMoney(i.currAmount)}원 지출.`);
    });
  }
  if (result.removedItems.length > 0) {
    result.removedItems.forEach(i => {
      insightItems.push(`[소멸] ${i.category}: ${m1}에 ${formatMoney(i.prevAmount)}원이었으나 ${m2}에 발생하지 않음.`);
    });
  }
  result.increasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5).forEach(i => {
    insightItems.push(`[증가] ${i.category}: ${formatMoney(i.prevAmount)}원 → ${formatMoney(i.currAmount)}원 (+${formatMoney(i.diff)}원, +${i.pctChange}%)`);
  });
  result.decreasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5).forEach(i => {
    insightItems.push(`[감소] ${i.category}: ${formatMoney(i.prevAmount)}원 → ${formatMoney(i.currAmount)}원 (-${formatMoney(Math.abs(i.diff))}원, ${i.pctChange}%)`);
  });

  setFont(doc);
  doc.setFontSize(9);
  doc.setTextColor(50);

  insightItems.forEach((item) => {
    if (y > ph - 20) {
      newPage(doc);
      y = 18;
      y = addSectionTitle(doc, '핵심 인사이트 (계속)', y, [180, 120, 0]);
      doc.setFontSize(9);
    }

    if (item === '') {
      y += 3;
      return;
    }

    setFont(doc);
    const wrapped = doc.splitTextToSize(item, maxTextW);

    if (item.startsWith('[신규]')) doc.setFillColor(59, 130, 246);
    else if (item.startsWith('[소멸]')) doc.setFillColor(234, 88, 12);
    else if (item.startsWith('[증가]')) doc.setFillColor(220, 38, 38);
    else if (item.startsWith('[감소]')) doc.setFillColor(5, 150, 105);
    else doc.setFillColor(30, 64, 175);

    doc.circle(17, y - 0.8, 1.2, 'F');
    setFont(doc);
    doc.setTextColor(50);
    doc.text(wrapped, 21, y);
    y += wrapped.length * lineH + 1;
  });
}

function renderCategoryTable(ctx: PdfContext, catSummary: CategorySummaryItem[]): void {
  const { doc, m1, m2 } = ctx;

  newPage(doc);
  let y = 18;
  y = addSectionTitle(doc, '계정과목별 총평', y);

  autoTable(doc, {
    startY: y,
    head: [['계정과목', m1, m2, '증감액', '증감률', '상태', '거래처 변동']],
    body: catSummary.map(c => [
      c.category,
      `${formatMoney(c.prevAmount)}원`,
      `${formatMoney(c.currAmount)}원`,
      `${c.diff >= 0 ? '+' : ''}${formatMoney(c.diff)}원`,
      `${c.pctChange >= 0 ? '+' : ''}${c.pctChange}%`,
      STATUS_KR[c.status] || c.status,
      c.vendorCount > 0 ? `${c.vendorCount}건 (신규${c.newVendors} 제거${c.removedVendors})` : '-',
    ]),
    styles: { font: FONT_NAME, fontSize: 8, cellPadding: 3.5 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'normal', fontSize: 8.5, font: FONT_NAME },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 42 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      data.cell.styles.font = FONT_NAME;
      if (data.section === 'body' && data.column.index === 3) {
        const val = catSummary[data.row.index]?.diff;
        if (val !== undefined) {
          if (val > 0) data.cell.styles.textColor = [220, 38, 38];
          else if (val < 0) data.cell.styles.textColor = [5, 150, 105];
        }
      }
      if (data.section === 'body' && data.column.index === 5) {
        const status = catSummary[data.row.index]?.status;
        if (status === 'new') data.cell.styles.textColor = [59, 130, 246];
        else if (status === 'removed') data.cell.styles.textColor = [234, 88, 12];
        else if (status === 'increased') data.cell.styles.textColor = [220, 38, 38];
        else if (status === 'decreased') data.cell.styles.textColor = [5, 150, 105];
      }
    },
    didDrawPage: () => { setFont(doc); },
  });
}

function applyPageFooters(ctx: PdfContext): void {
  const { doc, m1, m2 } = ctx;
  // jsPDF runtime exposes getNumberOfPages() but it isn't in the published types.
  const totalPages = (doc.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setFont(doc);
    addPageFooter(doc, i, totalPages, m1, m2);
  }
}

export async function exportPdf(result: AnalysisResult): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  await loadKoreanFont(doc);
  setFont(doc);

  const ctx: PdfContext = {
    doc,
    result,
    m1: formatMonthLabel(result.month1.label),
    m2: formatMonthLabel(result.month2.label),
    today: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    pw: doc.internal.pageSize.getWidth(),
    ph: doc.internal.pageSize.getHeight(),
    diffSign: result.totalDiff >= 0 ? '+' : '',
  };

  renderCoverPage(ctx);
  renderInsightsPage(ctx);
  renderCategoryTable(ctx, buildCategorySummary(result));
  applyPageFooters(ctx);

  doc.save(`분석보고서_${result.month1.label}_vs_${result.month2.label}.pdf`);
}
