import type { ShipmentGroup } from '../types/shipment';
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
 * Print gatepass document using the original Admin-Panel implementation pattern
 * Generates and prints a professional A4-formatted gatepass document with QR code,
 * shipment details, and barcode information.
 *
 * @param selectedGroup - The shipment group data to print
 * @param headerContent - HTML element to populate with header information
 * @param iframeRef - Hidden iframe element used for printing
 * @param onComplete - Optional callback function called after print dialog
 */
export const printDocument = async (
  selectedGroup: ShipmentGroup,
  headerContent: HTMLElement,
  iframeRef: HTMLIFrameElement,
  onComplete?: () => void
): Promise<void> => {
  const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
  if (!iframeDoc) return;

  const barcodeData = `${selectedGroup.vehicle_number}:${selectedGroup.created_datetime}`;
  const svg = renderSVG(barcodeData, { ecc: "Q", pixelSize: 5 });

  // Calculate total bag count for this specific group
  const totalBagCount = selectedGroup.shipments.reduce((total, shipment) => {
    return total + (shipment.barcode_records?.length || 0);
  }, 0);

  // Populate header content dynamically (matching original implementation)
  headerContent.innerHTML = `
    <span class="block">Vehicle Number: ${selectedGroup.vehicle_number}</span>
    <span class="block">
      Dispatch Date: ${new Date(selectedGroup.created_datetime).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </span>
    <span class="block">
      Total Shipment Quantity: ${selectedGroup.shipments.reduce((sum, shipment) => sum + shipment.quantity, 0)} kg
    </span>
    <span class="block">
      Total Bag Count: ${totalBagCount} bags
    </span>
  `;

  // Generate expanded content HTML with 3-column list view for PO details and table view for barcode details
  let expandedContentHTML = `
    <div style="width: 100%;">
  `;

  // Generate content for each shipment
  selectedGroup.shipments.forEach((shipment) => {
    const barcodeRecords = shipment.barcode_records || [];

    expandedContentHTML += `
      <div class="page-block" style="border: 1px solid #ccc; margin-bottom: 16px;">
        <div style="display: grid; padding: 16px; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <strong>Production Order:</strong><br>
            <span>${shipment.production_order}</span>
          </div>
          <div>
            <strong>Product Name:</strong><br>
            <span>${shipment.product_name}</span>
          </div>
          <div>
            <strong>Quantity:</strong><br>
            <span>${shipment.quantity} kg</span>
          </div>
          <div>
            <strong>Batch:</strong><br>
            <span>${shipment.shipment_code}</span>
          </div>
          <div>
            <strong>Item Count:</strong><br>
            <span>${barcodeRecords.length} bags</span>
          </div>
          <div></div>
        </div>`;

    // Add barcode table if records exist
    if (barcodeRecords.length > 0) {
      expandedContentHTML += `
        <div style="background-color: #f9f9f9;">
          <table style="width: 100%; border-collapse: collapse; background-color: white;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px 16px; text-align: left;">Barcode</th>
                <th style="border: 1px solid #ddd; padding: 8px 16px; text-align: left;">Item Code</th>
                <th style="border: 1px solid #ddd; padding: 8px 16px; text-align: left;">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>`;

      barcodeRecords.forEach((record) => {
        expandedContentHTML += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px 16px; word-break: break-all; font-size: 12px;">${record.barcode}</td>
            <td style="border: 1px solid #ddd; padding: 8px 16px;">${record.item_code}</td>
            <td style="border: 1px solid #ddd; padding: 8px 16px;">${record.amount}</td>
          </tr>`;
      });

      expandedContentHTML += `
            </tbody>
          </table>
        </div>`;
    } else {
      expandedContentHTML += `
        <div style="background-color: #f9f9f9; padding: 12px; border-radius: 4px;">
          <p style="color: #666; margin: 0;">No barcode details found.</p>
        </div>`;
    }

    expandedContentHTML += `</div>`;
  });

  expandedContentHTML += `</div>`;

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            .page-block {
              page-break-inside: avoid;
            }
            header {
              page-break-after: avoid;
            }
          }
          body {
            margin: 0;
            width: 210mm;
            font-family: Arial, sans-serif;
          }
          header {
            display: flex;
            border: 1px solid #ccc;
            padding: 8px;
            margin-bottom: 8px;
          }
          header > div {
            flex: 1 1 auto;
          }
          header > div span {
            display: block;
          }
          header > div span + span {
            margin-top: 8px;
          }
          header > svg {
            flex: 0 1 auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #ccc;
            padding: 8px;
          }
          h1 {
            margin-bottom: 20px;
          }
          .block {
            display: block;
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <span> Reference: ${barcodeData} </span>
            ${headerContent.innerHTML}
          </div>
          ${svg}
        </header>
        ${expandedContentHTML}
      </body>
    </html>
  `);
  iframeDoc.close();
  iframeRef.contentWindow!.onload = function () {
    iframeRef.contentWindow!.print();
    if (onComplete) {
      onComplete();
    }
  };
};