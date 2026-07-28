const PDFDocument = require('pdfkit');

/**
 * Converts a base64 Data URL (e.g. data:image/png;base64,...) to a binary Buffer.
 * @param {string} base64Str
 * @returns {Buffer|null}
 */
const convertBase64ToBuffer = (base64Str) => {
  if (!base64Str) return null;

  // If it starts with data:image/..., strip the prefix
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return Buffer.from(matches[2], 'base64');
  }

  try {
    return Buffer.from(base64Str, 'base64');
  } catch (e) {
    console.log('Failed to convert base64 to buffer:', e.message);
    return null;
  }
};

/**
 * Generates a branded PDF receipt as an in-memory Buffer.
 * @param {Object} payment - Mongoose payment model populated with panelId
 * @param {Object} settings - Organization branding settings (contains base64 logo & stamp)
 * @returns {Promise<Buffer>}
 */
const generateReceiptPDF = (payment, settings = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const orgName = settings.orgName || 'DEEPMIND INFOTECH';
      const clientName = payment.panelId?.panelName || 'Client';
      const ownerName = payment.panelId?.ownerName || 'Client';
      const email = payment.panelId?.ownerEmail || 'N/A';
      const phone = payment.panelId?.phoneNumber || 'N/A';

      const receiptId = `REC-${payment._id.toString().substring(18).toUpperCase()}`;
      const dateStr = new Date(payment.timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const billAmount = payment.billAmount || 0;
      const amountPaid = payment.amountReceived || 0;
      const discount = (payment.billDiscount || 0) + (payment.paymentDiscount || 0);
      const balance = (billAmount - (payment.billDiscount || 0)) - (amountPaid + (payment.paymentDiscount || 0));

      // Decode base64 images to Buffers
      const logoBuffer = settings.logo ? convertBase64ToBuffer(settings.logo) : null;
      const stampBuffer = settings.stamp ? convertBase64ToBuffer(settings.stamp) : null;

      // --- HEADER & BRANDING ---
      // Primary Indigo accent bar at the top
      doc.rect(40, 40, 515, 8).fill('#4f46e5');

      // Draw Logo or fall back to Text
      let infoStartY = 125;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 40, 55, { height: 35 });
          doc.fillColor('#64748b')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text('OFFICIAL TRANSACTION RECEIPT', 40, 98, { characterSpacing: 1.5 });

          doc.moveTo(40, 115).lineTo(555, 115).lineWidth(1).strokeColor('#e2e8f0').stroke();
          infoStartY = 130;
        } catch (logoErr) {
          console.log('Failed to render base64 logo in PDF, using text fallback:', logoErr.message);
          doc.fillColor('#0f172a')
            .fontSize(22)
            .font('Helvetica-Bold')
            .text(orgName.toUpperCase(), 40, 60);

          doc.fillColor('#64748b')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text('OFFICIAL TRANSACTION RECEIPT', 40, 88, { characterSpacing: 1.5 });

          doc.moveTo(40, 110).lineTo(555, 110).lineWidth(1).strokeColor('#e2e8f0').stroke();
          infoStartY = 125;
        }
      } else {
        doc.fillColor('#0f172a')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(orgName.toUpperCase(), 40, 60);

        doc.fillColor('#64748b')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('OFFICIAL TRANSACTION RECEIPT', 40, 88, { characterSpacing: 1.5 });

        doc.moveTo(40, 110).lineTo(555, 110).lineWidth(1).strokeColor('#e2e8f0').stroke();
        infoStartY = 125;
      }

      // Status Stamp (Right Aligned in the Header)
      const isPaid = amountPaid >= (billAmount - (payment.billDiscount || 0));
      const statusText = isPaid ? 'PAID' : (amountPaid > 0 ? 'PART PAID' : 'DUE');
      const statusColor = isPaid ? '#10b981' : (amountPaid > 0 ? '#f59e0b' : '#ef4444');

      doc.rect(430, 60, 125, 26).lineWidth(2).stroke(statusColor);
      doc.fillColor(statusColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(statusText, 430, 68, { width: 125, align: 'center' });

      // --- INFO BLOCK ---
      // Left Column: Bill To
      doc.fillColor('#4f46e5').fontSize(9).font('Helvetica-Bold').text('BILL TO:', 40, infoStartY);
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(ownerName, 40, infoStartY + 15);

      const clientDetailsY = infoStartY + 30;
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
        .text(`Panel: ${clientName}`, 40, clientDetailsY)
        .text(`Email: ${email}`, 40, clientDetailsY + 15)
        .text(`Phone: +${phone}`, 40, clientDetailsY + 30);

      if (payment.panelId?.gstNumber) {
        doc.fillColor('#4f46e5').fontSize(8).font('Helvetica-Bold')
          .text(`GSTIN: ${payment.panelId.gstNumber}`, 40, clientDetailsY + 45);
      }

      // Right Column: Receipt Details
      doc.fillColor('#4f46e5').fontSize(9).font('Helvetica-Bold').text('RECEIPT DETAILS:', 340, infoStartY);
      doc.fillColor('#334155').fontSize(9).font('Helvetica')
        .text(`Receipt No: `, 340, infoStartY + 15, { continued: true })
        .font('Helvetica-Bold').fillColor('#0f172a').text(receiptId)
        .font('Helvetica').fillColor('#334155')
        .text(`Date: `, 340, infoStartY + 30, { continued: true })
        .font('Helvetica-Bold').fillColor('#0f172a').text(dateStr)
        .font('Helvetica').fillColor('#334155')
        .text(`Payment Type: `, 340, infoStartY + 45, { continued: true })
        .font('Helvetica-Bold').fillColor('#0f172a').text(payment.paymentType)
        .font('Helvetica').fillColor('#334155')
        .text(`Payment Mode: `, 340, infoStartY + 60, { continued: true })
        .font('Helvetica-Bold').fillColor('#0f172a').text(`${payment.paymentMode || '-'} ${payment.bankName ? `(${payment.bankName})` : ''}`);

      const divider2Y = infoStartY + 85;
      doc.moveTo(40, divider2Y).lineTo(555, divider2Y).lineWidth(1).strokeColor('#e2e8f0').stroke();

      // --- ITEM TABLE ---
      const tableStartY = divider2Y + 15;

      // Calculate item values
      const qty = payment.paymentType === 'License' || payment.paymentType === 'IP Charges' ? payment.quantity || 1 : 1;
      const unitRate = payment.unitPrice || (payment.billAmount || payment.amountReceived);
      const amount = payment.billAmount > 0 ? payment.billAmount : payment.amountReceived;

      // Table Header Row
      doc.rect(40, tableStartY, 515, 22).fill('#f8fafc');
      doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold')
        .text('DESCRIPTION', 50, tableStartY + 7, { width: 220 })
        .text('QTY', 270, tableStartY + 7, { width: 50, align: 'center' })
        .text('UNIT RATE', 330, tableStartY + 7, { width: 100, align: 'right' })
        .text('AMOUNT', 440, tableStartY + 7, { width: 105, align: 'right' });

      // Table Body Row
      const bodyRowY = tableStartY + 30;
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
        .text(`${payment.paymentType} Fees`, 50, bodyRowY, { width: 220 });
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(`Software Panel Charge Module`, 50, bodyRowY + 15);

      // Qty
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
        .text(qty.toString(), 270, bodyRowY, { width: 50, align: 'center' });

      // Unit Rate
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(`₹${unitRate.toLocaleString()}`, 330, bodyRowY, { width: 100, align: 'right' });

      // Amount
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
        .text(`₹${amount.toLocaleString()}`, 440, bodyRowY, { width: 105, align: 'right' });

      const divider3Y = bodyRowY + 40;
      doc.moveTo(40, divider3Y).lineTo(555, divider3Y).lineWidth(1).strokeColor('#e2e8f0').stroke();

      // --- TOTALS & CALCULATIONS ---
      const startX = 320;
      let currentY = divider3Y + 15;

      const addSummaryRow = (label, val, isBold = false, valColor = '#0f172a') => {
        doc.fillColor(isBold ? '#0f172a' : '#475569')
          .fontSize(isBold ? 9 : 8)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .text(label, startX, currentY, { width: 120 });

        doc.fillColor(valColor)
          .fontSize(isBold ? 10 : 8)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .text(val, 420, currentY, { width: 125, align: 'right' });

        currentY += 18;
      };

      if (payment.billAmount > 0) {
        addSummaryRow('Invoice Total (Bill):', `₹${billAmount.toLocaleString()}`);
      }
      if (payment.billDiscount > 0) {
        addSummaryRow('Bill Discount:', `-₹${payment.billDiscount.toLocaleString()}`, false, '#f59e0b');
      }

      addSummaryRow('Amount Received:', `₹${amountPaid.toLocaleString()}`, true, '#10b981');

      if (payment.paymentDiscount > 0) {
        addSummaryRow('Payment Discount:', `-₹${payment.paymentDiscount.toLocaleString()}`, false, '#ef4444');
      }

      if (payment.billAmount > 0) {
        // Bottom border for totals
        doc.moveTo(startX, currentY - 2).lineTo(555, currentY - 2).lineWidth(1).strokeColor('#e2e8f0').stroke();
        currentY += 5;
        const remainingBalance = balance > 0 ? balance : 0;
        addSummaryRow('Balance Due:', `₹${remainingBalance.toLocaleString()}`, true, remainingBalance > 0 ? '#ef4444' : '#475569');
      }

      // --- REMARK / NOTES ---
      if (payment.remark) {
        const remarkY = divider3Y + 15;
        doc.fillColor('#4f46e5').fontSize(9).font('Helvetica-Bold').text('REMARK / NOTES:', 40, remarkY);
        doc.fillColor('#475569').fontSize(9).font('Helvetica').text(payment.remark, 40, remarkY + 15, { width: 250 });
      }

      // --- STAMP & FOOTER SIGNATURE ---
      // Render Stamp in footer if provided
      if (stampBuffer) {
        try {
          doc.image(stampBuffer, 247, 430, { height: 40 });
          doc.fillColor('#64748b')
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('(AUTHORIZED SIGNATORY & STAMP)', 40, 475, { width: 515, align: 'center' });
        } catch (stampErr) {
          console.log('Failed to render base64 stamp in PDF:', stampErr.message);
        }
      }

      // Branded Seal Footer Overlay
      doc.rect(40, 520, 515, 55).fill('#f1f5f9');
      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold')
        .text(`${orgName} Services`, 50, 530)
        .fontSize(7).font('Helvetica')
        .text(`Verified by ${payment.addedBy?.name || 'Staff User'} • This is an electronically generated transaction statement.`, 50, 545)
        .text('THANK YOU FOR YOUR BUSINESS!', 50, 557, { characterSpacing: 1 });

      // End of document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceiptPDF };
