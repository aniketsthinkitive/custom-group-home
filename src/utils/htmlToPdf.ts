import jsPDF from "jspdf";

/**
 * Converts an HTML string into a PDF Blob using jsPDF + html2canvas.
 *
 * Renders the HTML inside a hidden off-screen container so html2canvas can
 * capture it, then produces a multi-page letter-size PDF.
 */
export async function htmlToPdfBlob(html: string): Promise<Blob> {
  // Create a hidden container to render the HTML
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-20000px";
  container.style.left = "-20000px";
  container.style.width = "816px"; // ~8.5in at 96dpi
  container.style.background = "#fff";
  document.body.appendChild(container);

  // Write HTML into an iframe so styles are isolated
  const iframe = document.createElement("iframe");
  iframe.style.width = "816px";
  iframe.style.height = "auto";
  iframe.style.border = "none";
  container.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    container.remove();
    throw new Error("Could not access iframe document for PDF generation");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for images (signatures, etc.) to load
  const images = iframeDoc.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );

  // Small delay so styles fully apply
  await new Promise((r) => setTimeout(r, 200));

  // Measure actual body height
  const body = iframeDoc.body;
  const contentWidth = body.scrollWidth || 816;
  const contentHeight = body.scrollHeight || 1056;

  // Resize iframe to full content height so html2canvas captures everything
  iframe.style.height = `${contentHeight + 40}px`;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter", // 612 x 792 pt
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const scale = pageWidth / contentWidth;

  try {
    await pdf.html(body, {
      x: 0,
      y: 0,
      width: pageWidth,
      windowWidth: contentWidth,
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: contentWidth,
        windowHeight: contentHeight,
      },
      autoPaging: "text",
      margin: [0, 0, 0, 0],
    });

    // Remove blank trailing pages
    const totalPages = pdf.getNumberOfPages();
    if (totalPages > 1) {
      // Check last page — remove if blank (height leftover from autoPaging)
      const lastPageHeight = contentHeight * scale - (totalPages - 1) * pageHeight;
      if (lastPageHeight < 10) {
        pdf.deletePage(totalPages);
      }
    }
  } finally {
    container.remove();
  }

  return pdf.output("blob");
}

/**
 * Convenience: converts HTML to a File object ready for upload.
 */
export async function htmlToPdfFile(
  html: string,
  filename: string,
): Promise<File> {
  const blob = await htmlToPdfBlob(html);
  return new File([blob], filename, { type: "application/pdf" });
}
