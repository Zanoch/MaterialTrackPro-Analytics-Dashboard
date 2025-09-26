import type { TraderRequest, TraderRequestEntity } from '../types/trader';
import { encode } from "uqr";

/**
 * QR Code generation function (from Admin-Panel implementation)
 * Generates an SVG string for a QR code using the uqr library
 */
function renderSVG(data: string, options: { ecc?: "L" | "M" | "Q" | "H"; pixelSize?: number; whiteColor?: string; blackColor?: string }) {
  const result = encode(data, options);
  const { pixelSize = 10, whiteColor = "white", blackColor = "black" } = options;
  const height = result.size * pixelSize;
  const width = result.size * pixelSize;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  const pathes = [];

  for (let row = 0; row < result.size; row++) {
    for (let col = 0; col < result.size; col++) {
      const x = col * pixelSize;
      const y = row * pixelSize;
      if (result.data[row][col]) pathes.push(`M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
    }
  }

  svg += `<rect fill="${whiteColor}" width="${width}" height="${height}"/>`;
  svg += `<path fill="${blackColor}" d="${pathes.join("")}"/>`;

  svg += "</svg>";
  return svg;
}

/**
 * Print individual trader request document following ShipmentLog implementation pattern
 * Generates and prints a professional A4-formatted document with QR code,
 * trader request details, and lab sample information.
 *
 * @param traderRequest - The trader request data to print
 * @param entity - The entity type (blendsheet or flavorsheet)
 * @param headerContent - HTML element to populate with header information
 * @param iframeRef - Hidden iframe element used for printing
 * @param onComplete - Optional callback function called after print dialog
 */
export const printTraderRequestDocument = async (
  traderRequest: TraderRequest,
  entity: TraderRequestEntity,
  headerContent: HTMLElement,
  iframeRef: HTMLIFrameElement,
  onComplete?: () => void
): Promise<void> => {
  const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
  if (!iframeDoc) return;

  const entityNo = traderRequest.entity_no;
  const barcodeData = `${entity}:${entityNo}:${traderRequest.created_ts}`;
  const svg = renderSVG(barcodeData, { ecc: "Q", pixelSize: 5 });

  // Populate header content (modified for trader requests)
  headerContent.innerHTML = `
    <span class="block">${entity.charAt(0).toUpperCase() + entity.slice(1)} No: ${entityNo}</span>
    <span class="block">
      Request Date: ${new Date(traderRequest.created_ts).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </span>
    <span class="block">Remarks: ${traderRequest.remarks || 'No remarks'}</span>
    <span class="block">Total Samples: ${traderRequest.batches?.length || 0}</span>
    ${traderRequest.event?.storekeeper ? `<span class="block">Storekeeper: ${traderRequest.event.storekeeper}</span>` : ''}
  `;

  // Generate content for this specific trader request (removed Request Details section)
  let contentHTML = `
    <div style="width: 100%;">
  `;

  // Add batch details table with complete lab results (no pending states)
  if (traderRequest.batches && traderRequest.batches.length > 0) {
    contentHTML += `
      <div class="page-block" style="border: 1px solid #ccc;">
        <h3 style="margin: 16px; color: #237c4b;">Lab Sample Information</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: white;">
          <thead>
            <tr style="background-color: #f0f9f4;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item Code</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Created Date</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Moisture Content (%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Bag ID</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Handler</th>
            </tr>
          </thead>
          <tbody>
    `;

    traderRequest.batches.forEach((batch) => {
      contentHTML += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${batch.item_code}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(batch.created_ts).toLocaleDateString('en-GB')}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch.event?.moisture_content || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${batch.event?.bag_id || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${batch.event?.storekeeper || '-'}</td>
        </tr>
      `;
    });

    contentHTML += `
          </tbody>
        </table>
      </div>
    `;
  } else {
    contentHTML += `
      <div class="page-block" style="border: 1px solid #ccc;">
        <h3 style="margin: 16px; color: #237c4b;">Lab Sample Information</h3>
        <div style="background-color: #f9f9f9; padding: 12px; border-radius: 4px; margin: 16px;">
          <p style="color: #666; margin: 0;">No lab samples found.</p>
        </div>
      </div>
    `;
  }

  contentHTML += `</div>`;

  // Use exact same print structure as ShipmentLog
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @media print {
            @page { size: A4; margin: 20mm; }
            .page-block { page-break-inside: avoid; }
            header { page-break-after: avoid; }
          }
          body { margin: 0; width: 210mm; font-family: Arial, sans-serif; }
          header { display: flex; border: 1px solid #ccc; padding: 8px; margin-bottom: 8px; }
          header > div { flex: 1 1 auto; }
          header > div span { display: block; margin-top: 8px; }
          header > svg { flex: 0 1 auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          h3 { margin-bottom: 16px; color: #237c4b; }
          .block { display: block; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <span style="font-weight: bold;">Trader Request Document</span>
            ${headerContent.innerHTML}
          </div>
          ${svg}
        </header>
        ${contentHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  iframeRef.contentWindow!.onload = function () {
    iframeRef.contentWindow!.print();
    if (onComplete) onComplete();
  };
};