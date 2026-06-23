import jsPDF from 'jspdf';
import dayjs from 'dayjs';

/* ─── types ─── */

export interface InventoryItemData {
  id?: string;
  movedInWith?: string;
  movedInDate?: string | null;
  purchased?: string;
  purchasedDate?: string | null;
  brokenLostDamaged?: string;
  brokenLostDate?: string | null;
  [key: string]: any;
}

export interface ResidentInventoryListFormData {
  items?: InventoryItemData[];
  [key: string]: any;
}

/* ─── helpers ─── */

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = dayjs(value);
  return d.isValid() ? d.format('MM/DD/YYYY') : '';
}

function safeTrim(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).trim();
}

/* ─── layout constants ─── */

const PAGE_W = 210; // A4 portrait mm
const PAGE_H = 297;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT; // 180mm

// Column widths must sum to CONTENT_W (180mm)
const COLS = [
  { label: 'MOVED IN WITH', width: 36 },
  { label: 'DATE', width: 27 },
  { label: 'PURCHASED', width: 30 },
  { label: 'DATE', width: 27 },
  { label: 'Broken / Lost /\nDamaged', width: 36 },
  { label: 'DATE', width: 24 },
]; // total = 36+27+30+27+36+24 = 180 ✓

const HEADER_ROW_H = 14; // taller to fit 2-line header text
const DATA_ROW_H = 8;    // data rows
const MIN_BLANK_ROWS = 5; // always show at least this many blank rows after data

/* ─── core drawing helpers ─── */

/** Draw all column borders for a single row */
function drawRowBorders(pdf: jsPDF, x: number, y: number, h: number) {
  let cx = x;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  for (const col of COLS) {
    pdf.rect(cx, y, col.width, h);
    cx += col.width;
  }
}

/** Write vertically-centered, horizontally-centered text inside a cell */
function writeCellText(
  pdf: jsPDF,
  text: string,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  bold = false,
  fontSize = 8,
) {
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(0, 0, 0);

  const lines = text.split('\n');
  const lineH = fontSize * 0.352778 * 1.3; // pt → mm, line spacing 1.3
  const totalTextH = lines.length * lineH;
  const startY = cellY + (cellH - totalTextH) / 2 + lineH * 0.8; // baseline of first line

  lines.forEach((line, i) => {
    const tw = pdf.getTextWidth(line);
    const tx = cellX + (cellW - tw) / 2;
    const ty = startY + i * lineH;
    pdf.text(line, tx, ty);
  });
}

/** Draw the 6-column header row */
function drawHeader(pdf: jsPDF, y: number): number {
  drawRowBorders(pdf, MARGIN_LEFT, y, HEADER_ROW_H);
  let cx = MARGIN_LEFT;
  for (const col of COLS) {
    writeCellText(pdf, col.label, cx, y, col.width, HEADER_ROW_H, true, 8);
    cx += col.width;
  }
  return y + HEADER_ROW_H;
}

/** Draw one data row and return the new Y position */
function drawDataRow(
  pdf: jsPDF,
  item: InventoryItemData,
  y: number,
  rowH: number,
): number {
  drawRowBorders(pdf, MARGIN_LEFT, y, rowH);

  const cells = [
    safeTrim(item.movedInWith),
    formatDate(item.movedInDate),
    safeTrim(item.purchased),
    formatDate(item.purchasedDate),
    safeTrim(item.brokenLostDamaged),
    formatDate(item.brokenLostDate),
  ];

  let cx = MARGIN_LEFT;
  cells.forEach((val, i) => {
    if (val) {
      writeCellText(pdf, val, cx, y, COLS[i].width, rowH, false, 7);
    }
    cx += COLS[i].width;
  });

  return y + rowH;
}

/** Draw a blank (empty) row */
function drawBlankRow(pdf: jsPDF, y: number, rowH: number): number {
  drawRowBorders(pdf, MARGIN_LEFT, y, rowH);
  return y + rowH;
}

/** Add a new page and return the starting Y for the table */
function addPage(pdf: jsPDF): number {
  pdf.addPage();
  const y = drawHeader(pdf, MARGIN_TOP);
  return y;
}

/* ─── main export ─── */

export function generateResidentInventoryListPDF(
  formData: ResidentInventoryListFormData,
  individualName?: string,
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Title ──────────────────────────────────────────────────────────────────
  let y = MARGIN_TOP;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  const title = 'Resident Inventory List';
  const titleW = pdf.getTextWidth(title);
  pdf.text(title, MARGIN_LEFT + (CONTENT_W - titleW) / 2, y);
  y += 10;

  // ── Individual Name line ───────────────────────────────────────────────────
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const nameLabel = "Individual's Name:";
  pdf.text(nameLabel, MARGIN_LEFT, y);
  const nameLabelW = pdf.getTextWidth(nameLabel);

  const nameValue = individualName ? ` ${individualName}` : '';
  pdf.setFont('helvetica', 'normal');
  pdf.text(nameValue, MARGIN_LEFT + nameLabelW, y);

  // underline from end of label to right margin
  const lineStartX = MARGIN_LEFT + nameLabelW + pdf.getTextWidth(nameValue) + 2;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(lineStartX, y, PAGE_W - MARGIN_RIGHT, y);
  y += 8;

  // ── Table ──────────────────────────────────────────────────────────────────
  const items: InventoryItemData[] = Array.isArray(formData?.items) ? formData.items : [];

  // How many rows fit on first page after header?
  y = drawHeader(pdf, y);
  const firstPageAvail = PAGE_H - MARGIN_BOTTOM - y;
  const rowsOnFirstPage = Math.floor(firstPageAvail / DATA_ROW_H);

  // How many rows fit on subsequent pages?
  const otherPageAvail = PAGE_H - MARGIN_BOTTOM - (MARGIN_TOP + HEADER_ROW_H);
  const rowsPerPage = Math.floor(otherPageAvail / DATA_ROW_H);

  // Total rows needed: data rows + blank buffer
  const totalDataRows = items.length;
  const totalRows = Math.max(totalDataRows + MIN_BLANK_ROWS, rowsOnFirstPage);

  let rowIndex = 0;
  let pageRowsLeft = rowsOnFirstPage;

  for (let i = 0; i < totalRows; i++) {
    // Need a new page?
    if (pageRowsLeft <= 0) {
      y = addPage(pdf);
      pageRowsLeft = rowsPerPage;
    }

    if (i < items.length) {
      y = drawDataRow(pdf, items[i], y, DATA_ROW_H);
    } else {
      y = drawBlankRow(pdf, y, DATA_ROW_H);
    }

    pageRowsLeft--;
    rowIndex++;
  }

  // ── Open & print ──────────────────────────────────────────────────────────
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const windowName = `resident-inventory-pdf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const printWindow = window.open(pdfUrl, windowName);

  if (printWindow) {
    let retries = 0;
    const interval = setInterval(() => {
      try {
        if (printWindow.document.readyState === 'complete' || retries >= 10) {
          clearInterval(interval);
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
          }, 500);
        }
        retries++;
      } catch {
        clearInterval(interval);
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        }, 1000);
      }
    }, 200);
  }
}
