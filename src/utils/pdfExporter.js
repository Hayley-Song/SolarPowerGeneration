import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 기존 다운로드 방식 유지. 화면 밖의 스냅샷을 만들고 복제 문서에서만 캡처한다.
export async function exportToPdf(page1Ref, page2Ref, filename = 'solar_simulation_report.pdf') {
  const originalPages = [page1Ref.current, page2Ref.current];
  if (originalPages.some(page => !page)) throw new Error('PDF 보고서가 준비되지 않았습니다.');

  // 사용자가 PDF 생성 중 입력값을 바꾸더라도 두 페이지가 같은 시점의 결과를 담도록 한다.
  const snapshot = document.createElement('div');
  snapshot.className = 'report-export-host';
  snapshot.setAttribute('aria-hidden', 'true');
  const pages = originalPages.map(page => page.cloneNode(true));
  snapshot.append(...pages);
  document.body.append(snapshot);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    pdf.setProperties({ title: '태양광 발전사업 수익 분석', subject: '20년 예상 수익 분석' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    for (const [index, page] of pages.entries()) {
      const canvas = await html2canvas(page, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 1000,
        windowHeight: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDocument, clonedPage) => {
          const host = clonedPage.closest('.report-export-host');
          host.style.position = 'absolute';
          host.style.left = '0';
          host.style.top = '0';
          // 다른 페이지가 겹치거나 캡처 범위에 들어오지 않도록 한다.
          host.querySelectorAll('.report-page').forEach(el => {
            if (el !== clonedPage) el.style.display = 'none';
          });
          clonedDocument.body.style.margin = '0';
        },
      });
      if (!canvas.width || !canvas.height) throw new Error('PDF 페이지 캡처에 실패했습니다.');
      if (index) pdf.addPage();
      // 이미지의 종횡비를 유지하며 A4 안에 맞춘다. 페이지 하단 잘림 방지.
      const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const w = canvas.width * scale, h = canvas.height * scale;
      pdf.addImage(canvas, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h, undefined, 'FAST');
      canvas.width = 0;
      canvas.height = 0;
    }
    pdf.save(filename);
  } finally {
    snapshot.remove();
  }
}
