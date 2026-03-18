import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, formatMonthLabel } from './excelParser';

const STATUS_KR = { new: '신규', removed: '제거', increased: '증가', decreased: '감소', unchanged: '동일' };
const FONT_NAME = 'NanumGothic';

async function loadKoreanFont(doc) {
  const fontUrl = import.meta.env.BASE_URL + 'fonts/NanumGothic-Regular.ttf';
  const res = await fetch(fontUrl);
  if (!res.ok) throw new Error('Font load failed');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = btoa(binary);
  doc.addFileToVFS('NanumGothic.ttf', base64);
  doc.addFont('NanumGothic.ttf', FONT_NAME, 'normal');
}

function setFont(doc) {
  doc.setFont(FONT_NAME, 'normal');
}

function addPageFooter(doc, pageNum, totalPages, m1, m2) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  setFont(doc);
  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text(`다비치 재무팀 분석 보고서  |  ${m1} vs ${m2}`, 14, ph - 8);
  doc.text(`${pageNum} / ${totalPages}`, pw - 14, ph - 8, { align: 'right' });
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, ph - 12, pw - 14, ph - 12);
}

function addSectionTitle(doc, title, y, color = [30, 64, 175]) {
  setFont(doc);
  doc.setFillColor(...color);
  doc.rect(14, y - 1, 4, 7, 'F');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 21, y + 4);
  return y + 12;
}

function newPage(doc) {
  doc.addPage();
  setFont(doc);
}

export async function exportPdf(result) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  await loadKoreanFont(doc);
  setFont(doc);

  const m1 = formatMonthLabel(result.month1.label);
  const m2 = formatMonthLabel(result.month2.label);
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const diffSign = result.totalDiff >= 0 ? '+' : '';

  // ════════════════ PAGE 1: Cover ════════════════
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
  doc.text(`작성일: ${today}  |  다비치 재무팀`, pw / 2, 48, { align: 'center' });

  // 요약 개요 박스
  let y = 70;
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

  // 핵심 인사이트 - 별도 페이지
  newPage(doc);
  y = 18;
  y = addSectionTitle(doc, '핵심 인사이트', y, [180, 120, 0]);

  const maxTextW = pw - 48;
  const lineH = 5.5;

  const insightItems = [];

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
  // 상세 항목 증감
  result.increasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5).forEach(i => {
    insightItems.push(`[증가] ${i.category}: ${formatMoney(i.prevAmount)}원 → ${formatMoney(i.currAmount)}원 (+${formatMoney(i.diff)}원, +${i.pctChange}%)`);
  });
  result.decreasedItems.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5).forEach(i => {
    insightItems.push(`[감소] ${i.category}: ${formatMoney(i.prevAmount)}원 → ${formatMoney(i.currAmount)}원 (-${formatMoney(Math.abs(i.diff))}원, ${i.pctChange}%)`);
  });
  // 거래처별 증감
  const topVendors = result.vendorComparison.slice(0, 5);
  if (topVendors.length > 0) {
    insightItems.push('');
    insightItems.push('[ 거래처별 주요 변동 ]');
    topVendors.forEach(v => {
      if (v.status === 'new') {
        insightItems.push(`[거래처 신규] ${v.vendor}: ${formatMoney(v.currAmount)}원 신규 거래 발생.`);
      } else if (v.status === 'removed') {
        insightItems.push(`[거래처 소멸] ${v.vendor}: 전월 ${formatMoney(v.prevAmount)}원, 당월 거래 없음.`);
      } else {
        const sign = v.diff > 0 ? '+' : '';
        insightItems.push(`[거래처 ${v.diff > 0 ? '증가' : '감소'}] ${v.vendor}: ${sign}${formatMoney(v.diff)}원 변동.`);
      }
    });
  }

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

    // 줄바꿈 처리
    setFont(doc);
    const wrapped = doc.splitTextToSize(item, maxTextW);

    // 컬러 도트
    if (item.startsWith('[신규]') || item.startsWith('[거래처 신규]')) doc.setFillColor(59, 130, 246);
    else if (item.startsWith('[소멸]') || item.startsWith('[거래처 소멸]')) doc.setFillColor(234, 88, 12);
    else if (item.startsWith('[증가]') || item.startsWith('[거래처 증가]')) doc.setFillColor(220, 38, 38);
    else if (item.startsWith('[감소]') || item.startsWith('[거래처 감소]')) doc.setFillColor(5, 150, 105);
    else if (item.startsWith('[')) doc.setFillColor(100, 116, 139);
    else doc.setFillColor(30, 64, 175);

    if (!item.startsWith('[') || item.startsWith('[ ')) {
      // 섹션 제목 (거래처별 주요 변동 등)
      setFont(doc);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text(item, 20, y);
      doc.setFontSize(9);
      doc.setTextColor(50);
      y += 7;
    } else {
      doc.circle(17, y - 0.8, 1.2, 'F');
      setFont(doc);
      doc.setTextColor(50);
      doc.text(wrapped, 21, y);
      y += wrapped.length * lineH + 1;
    }
  });

  // ════════════════ PAGE 2: Analysis Detail ════════════════
  newPage(doc);
  y = 18;
  y = addSectionTitle(doc, '분석 상세 요약', y);

  const analysisLines = [];

  if (result.totalDiff !== 0) {
    const dir = result.totalDiff > 0 ? '증가' : '감소';
    analysisLines.push(`[총괄] ${m1} 대비 ${m2} 총 비용이 ${formatMoney(Math.abs(result.totalDiff))}원 ${dir}하였습니다 (${diffSign}${result.totalPctChange}%).`);
  }

  result.removedItems.forEach(item => {
    analysisLines.push(`[제거] ${item.category}: ${m1}에 ${formatMoney(item.prevAmount)}원이었으나 ${m2}에는 발생하지 않음.`);
  });
  result.newItems.forEach(item => {
    analysisLines.push(`[신규] ${item.category}: ${m2}에 신규 발생, ${formatMoney(item.currAmount)}원 지출.`);
  });
  result.increasedItems.forEach(item => {
    analysisLines.push(`[증가] ${item.category}: ${formatMoney(item.prevAmount)}원 → ${formatMoney(item.currAmount)}원 (+${formatMoney(item.diff)}원, +${item.pctChange}%)`);
  });
  result.decreasedItems.forEach(item => {
    analysisLines.push(`[감소] ${item.category}: ${formatMoney(item.prevAmount)}원 → ${formatMoney(item.currAmount)}원 (-${formatMoney(Math.abs(item.diff))}원, ${item.pctChange}%)`);
  });

  setFont(doc);
  doc.setFontSize(9);
  analysisLines.forEach((line) => {
    if (y > ph - 20) {
      newPage(doc);
      y = 18;
      y = addSectionTitle(doc, '분석 상세 요약 (계속)', y);
      doc.setFontSize(9);
    }

    if (line.startsWith('[총괄]')) doc.setFillColor(30, 64, 175);
    else if (line.startsWith('[제거]')) doc.setFillColor(234, 88, 12);
    else if (line.startsWith('[신규]')) doc.setFillColor(59, 130, 246);
    else if (line.startsWith('[증가]')) doc.setFillColor(220, 38, 38);
    else if (line.startsWith('[감소]')) doc.setFillColor(5, 150, 105);

    doc.circle(17, y - 0.8, 1.2, 'F');
    setFont(doc);
    doc.setTextColor(50);
    doc.text(line, 21, y);
    y += 6;
  });

  // ════════════════ PAGE: Category Table ════════════════
  newPage(doc);
  y = 18;
  y = addSectionTitle(doc, '카테고리별 비교 테이블', y);

  autoTable(doc, {
    startY: y,
    head: [['카테고리', m1, m2, '증감액', '증감률', '상태']],
    body: result.categoryComparison.map(c => [
      c.category,
      `${formatMoney(c.prevAmount)}원`,
      `${formatMoney(c.currAmount)}원`,
      `${c.diff >= 0 ? '+' : ''}${formatMoney(c.diff)}원`,
      `${c.pctChange >= 0 ? '+' : ''}${c.pctChange}%`,
      STATUS_KR[c.status] || c.status,
    ]),
    styles: { font: FONT_NAME, fontSize: 8, cellPadding: 3.5 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'normal', fontSize: 8.5, font: FONT_NAME },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: 'right', cellWidth: 38 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 38 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      data.cell.styles.font = FONT_NAME;
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
    didDrawPage: () => { setFont(doc); },
  });

  // ════════════════ PAGE: Vendor Table ════════════════
  if (result.vendorComparison.length > 0) {
    newPage(doc);
    y = 18;
    y = addSectionTitle(doc, '거래처별 변동 내역', y, [6, 182, 212]);

    autoTable(doc, {
      startY: y,
      head: [['거래처', m1, m2, '증감액']],
      body: result.vendorComparison.map(v => [
        v.vendor,
        `${formatMoney(v.prevAmount)}원`,
        `${formatMoney(v.currAmount)}원`,
        `${v.diff >= 0 ? '+' : ''}${formatMoney(v.diff)}원`,
      ]),
      styles: { font: FONT_NAME, fontSize: 8, cellPadding: 3.5 },
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'normal', fontSize: 8.5, font: FONT_NAME },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'right', cellWidth: 42 },
        2: { halign: 'right', cellWidth: 42 },
        3: { halign: 'right', cellWidth: 42 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        data.cell.styles.font = FONT_NAME;
        if (data.section === 'body' && data.column.index === 3) {
          const val = result.vendorComparison[data.row.index]?.diff;
          if (val > 0) data.cell.styles.textColor = [220, 38, 38];
          else if (val < 0) data.cell.styles.textColor = [5, 150, 105];
        }
      },
      didDrawPage: () => { setFont(doc); },
    });
  }

  // ════════════════ Page numbers ════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setFont(doc);
    addPageFooter(doc, i, totalPages, m1, m2);
  }

  doc.save(`분석보고서_${result.month1.label}_vs_${result.month2.label}.pdf`);
}
