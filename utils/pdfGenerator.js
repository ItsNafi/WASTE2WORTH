const PDFDocument = require('pdfkit');

const PDFGenerator = {
  /**
   * Generates a PDF certificate and pipes it directly to the response stream.
   * @param {Object} res - Express response object
   * @param {Object} user - User object containing name and greenPoints
   * @param {String} type - Type of certificate ('Eco-Warrior', 'Top-Volunteer', etc.)
   */
  generateCertificate(res, user, type) {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    // Pipe the PDF into the HTTP response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${user.name.replace(/\s+/g, '_')}_${type}_Certificate.pdf"`);
    doc.pipe(res);

    // Draw Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#2e7d32');
    doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke('#4caf50');

    // Title
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('#1b5e20')
       .text('Certificate of Appreciation', { align: 'center' });
    
    doc.moveDown(1);

    // Subtitle
    doc.font('Helvetica')
       .fontSize(20)
       .fillColor('#000000')
       .text('This certificate is proudly presented to', { align: 'center' });
    
    doc.moveDown(1);

    // User Name
    doc.font('Helvetica-Bold')
       .fontSize(40)
       .fillColor('#2e7d32')
       .text(user.name, { align: 'center' });
    
    doc.moveDown(1);

    // Reason
    doc.font('Helvetica')
       .fontSize(18)
       .fillColor('#333333');
       
    let reasonText = `For outstanding contribution to the circular economy and environmental sustainability as an esteemed ${type}.`;
    doc.text(reasonText, { align: 'center' });

    doc.moveDown(1);
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#ff8f00')
       .text(`Total Green Points: ${user.greenPoints}`, { align: 'center' });

    doc.moveDown(3);

    // Signatures
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#000000');
    
    const signatureY = doc.y;
    
    doc.text('_________________________', 150, signatureY);
    doc.text('WASTE2WORTH Platform', 150, signatureY + 20);

    doc.text('_________________________', doc.page.width - 350, signatureY);
    doc.text('Community Admin', doc.page.width - 350, signatureY + 20);

    doc.end();
  }
};

module.exports = PDFGenerator;
