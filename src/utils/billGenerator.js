import jsPDF from "jspdf";
import QRCode from "qrcode";

export const generateBillPDF = async ({
  transaction,
  customer,
  items,
  subtotal,
  discountAmount,
  totalAmount,
  returnBlob = false,
}) => {
  // 1. Setup Receipt Format (80mm Width)
  // Standard thermal receipt width is around 80mm
  const paperWidth = 80;
  // Estimate height: header ~50, items ~10/item, footer ~60
  const estimatedHeight = 150 + (items.length * 10);
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [paperWidth, estimatedHeight]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let currentY = 10;

  // --- 2. Header (Axis Style) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AXIS", centerX, currentY, { align: "center" });
  currentY += 5;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("INDUSTRIES", centerX, currentY, { align: "center" });
  currentY += 6;

  // Date
  if (transaction.created_at) {
    const dateStr = new Date(transaction.created_at).toLocaleString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
    });
    doc.setFontSize(7);
    doc.text(dateStr, centerX, currentY, { align: "center" });
    currentY += 8;
  }

  // --- 3. Token Box (Dashed) ---
  const boxWidth = 60;
  const boxHeight = 16;
  const boxX = (pageWidth - boxWidth) / 2;
  
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.text("Token", centerX, currentY); // Label centered 
  
  currentY += 1;
  doc.setLineDash([1.5, 1.5], 0); // Dashed line
  doc.setLineWidth(0.3);
  doc.rect(boxX, currentY, boxWidth, boxHeight);
  doc.setLineDash([]); // Reset
  
  // Big Token Number
  const tokenText = transaction.transaction_number || "0000";
  doc.setFontSize(11);
  doc.text(tokenText, centerX, currentY + 10, { align: "center" });
  
  currentY += boxHeight + 5;

  // --- 4. Details Section ---
  const leftX = 5;
  const rightX = pageWidth - 5;
  
  const drawRow = (label, value, isBold = false) => {
    doc.setFont("courier", isBold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.text(label, leftX, currentY);
    doc.text(String(value), rightX, currentY, { align: "right" });
    currentY += 4;
  };
  
  const drawLine = () => {
    doc.setLineDash([1, 1], 0);
    doc.line(leftX, currentY, rightX, currentY);
    doc.setLineDash([]);
    currentY += 4;
  };

  if (customer && customer.paymentType) {
    drawRow("Token Type", customer.paymentType.toUpperCase(), true);
    currentY += 2;
    drawLine();
  }

  // Customer Info
  if (customer) {
    drawRow("Customer Name", customer.customerName || "Walk-in");
    if (customer.customerType) {
      drawRow("Customer Type", customer.customerType.type_name);
    }
  }
  
  currentY += 2;
  drawLine();

  // --- 5. Items (Meter Style) ---
  doc.setFont("courier", "bold");
  doc.text("Items Purchased", leftX, currentY);
  currentY += 5;
  
  items.forEach(item => {
    let name = item.product_name || "Item";
    if (name.length > 22) name = name.substring(0, 20) + "..";
    
    doc.setFont("courier", "normal");
    doc.text(`${name} x${item.quantity}`, leftX, currentY);
    doc.text((item.total_price || 0).toFixed(2), rightX, currentY, { align: "right" });
    currentY += 4;
  });

  currentY += 2;
  drawLine();

  // --- 6. Financials ---
  drawRow("Amount", (subtotal || 0).toFixed(2) + " USD");
  if (discountAmount > 0) {
    drawRow("Discount", "-" + discountAmount.toFixed(2) + " USD");
  }
  
  currentY += 2;
  doc.setFontSize(10);
  doc.setFont("courier", "bold");
  drawRow("Total", (totalAmount || 0).toFixed(2) + " USD", true);
  
  currentY += 2;
  drawLine();
  
  doc.setFontSize(8);
  drawRow("Operator", transaction.processed_by_name || "Admin");
  
  currentY += 8;

  // --- 7. QR Code (Order Data) ---
  try {
    const qrData = JSON.stringify({
      id: transaction.id,
      txn: transaction.transaction_number,
      total: totalAmount,
      date: transaction.created_at,
      p: customer?.paymentType
    });

    const qrUrl = await QRCode.toDataURL(qrData, { 
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 150 
    });
    
    // Draw QR centered at bottom
    const qrSize = 35; 
    // Calculate vertical centering if page height expands? No, just rely on currentY
    doc.addImage(qrUrl, 'PNG', (pageWidth - qrSize) / 2, currentY, qrSize, qrSize);
    currentY += qrSize + 4;
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
    doc.text("Scan for digital receipt", centerX, currentY, { align: "center" });

  } catch (err) {
    console.error("QR Gen Error", err);
  }

  if (returnBlob) {
    return doc.output("blob");
  }

  doc.save(`Receipt_${transaction.transaction_number}.pdf`);
};
