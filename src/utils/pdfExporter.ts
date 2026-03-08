import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  filename?: string;
  onProgress?: (percent: number, message: string) => void;
}

export async function exportElementToPdf(element: HTMLElement, options: ExportOptions = {}) {
  const filename = options.filename || 'destiny-career-report.pdf';
  options.onProgress?.(15, '正在捕获报告画面...');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#020617'
  });

  options.onProgress?.(65, '正在分页排版...');

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  options.onProgress?.(95, '正在生成PDF文件...');
  pdf.save(filename);
  options.onProgress?.(100, '导出完成');
}
