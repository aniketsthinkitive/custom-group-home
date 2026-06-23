/**
 * Prints HTML content using a hidden iframe, without opening a new tab.
 * The iframe is appended to the body, triggers print, then removes itself.
 */
export const printFormInPage = (html: string): void => {
  // Remove any previous print iframe
  const existing = document.getElementById("__print-iframe");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__print-iframe";
  iframe.style.position = "fixed";
  iframe.style.top = "-10000px";
  iframe.style.left = "-10000px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    iframe.remove();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for images (signatures) to load before printing
  const images = iframeDoc.querySelectorAll("img");
  const imagePromises = Array.from(images).map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      })
  );

  Promise.all(imagePromises).then(() => {
    // Small delay to ensure styles are applied
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Remove iframe after print dialog closes
      setTimeout(() => iframe.remove(), 1000);
    }, 300);
  });
};

export default printFormInPage;
