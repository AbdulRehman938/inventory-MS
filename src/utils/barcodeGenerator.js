import jsPDF from "jspdf";
import QRCode from "qrcode";

/**
 * Generate a QR code image data URL
 * @param {string} text - The text to encode
 * @returns {Promise<string>} - Base64 image data URL
 */
const generateQRCodeImage = async (text) => {
  try {
    // Generate QR code with good error correction
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

/**
 * Generate QR code labels PDF for selected items
 * @param {Array} items - Array of stock items with barcode/QR info
 */
export const generateBarcodesPDF = async (items) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Label dimensions (in mm) - Adjusted for square QR codes
  const labelWidth = 60;
  const labelHeight = 40; // Slightly taller for QR
  const labelsPerRow = 3;
  const labelsPerColumn = 7;
  const marginX = (pageWidth - labelsPerRow * labelWidth) / 2;
  const marginY = 10;

  let currentPage = 1;
  let currentRow = 0;
  let currentCol = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Calculate position
    const x = marginX + currentCol * labelWidth;
    const y = marginY + currentRow * labelHeight;

    // Draw label border
    doc.setLineWidth(0.1);
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, labelWidth, labelHeight);

    // Product name (truncated)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const productName =
      item.product_name.length > 25
        ? item.product_name.substring(0, 25) + "..."
        : item.product_name;
    doc.text(productName, x + labelWidth / 2, y + 5, { align: "center" });

    // Generate and add QR code
    // We use the 'barcode' field as it stores the unique identifier we want to scan
    if (item.barcode) {
      try {
        const qrImage = await generateQRCodeImage(item.barcode);
        // QR codes are square, so we center it
        const qrSize = 22;
        doc.addImage(qrImage, "PNG", x + (labelWidth - qrSize) / 2, y + 7, qrSize, qrSize);
      } catch (error) {
        console.error("Error adding QR to PDF:", error);
      }
    }

    // Code Text below QR
    doc.setFontSize(7);
    doc.setFont("courier", "bold");
    doc.text(item.barcode || "N/A", x + labelWidth / 2, y + 32, { align: "center" });

    // Price
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`$${item.unit_price.toFixed(2)}`, x + 3, y + 37);

    // SKU
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(item.sku || "", x + labelWidth - 3, y + 37, { align: "right" });

    // Move to next position
    currentCol++;
    if (currentCol >= labelsPerRow) {
      currentCol = 0;
      currentRow++;
    }

    // Check if we need a new page
    if (currentRow >= labelsPerColumn) {
      if (i < items.length - 1) {
        doc.addPage();
        currentPage++;
        currentRow = 0;
        currentCol = 0;
      }
    }
  }

  // Save the PDF
  doc.save(`QRCodes_${new Date().toISOString().split("T")[0]}.pdf`);
};
