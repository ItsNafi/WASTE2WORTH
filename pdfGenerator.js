const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const RECIPIENT_FONT_NAME = 'CertificateRecipientName';
let recipientFontPath;

const findRecipientFontPath = () => {
  if (recipientFontPath) return recipientFontPath;

  const projectRoot = path.resolve(__dirname, '..');
  const windowsFonts = process.env.WINDIR
    ? path.join(process.env.WINDIR, 'Fonts')
    : 'C:\\Windows\\Fonts';
  const candidates = [
    process.env.CERTIFICATE_UNICODE_FONT_PATH,
    path.join(projectRoot, 'assets', 'fonts', 'NotoSansBengali-Bold.ttf'),
    path.join(projectRoot, 'assets', 'fonts', 'NotoSansBengali-Regular.ttf'),
    path.join(projectRoot, 'public', 'fonts', 'NotoSansBengali-Bold.ttf'),
    path.join(projectRoot, 'public', 'fonts', 'NotoSansBengali-Regular.ttf'),
    path.join(windowsFonts, 'NirmalaB.ttf'),
    path.join(windowsFonts, 'Nirmala.ttf'),
    '/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansBengali-Bold.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansBengali-Regular.ttf'
  ];

  recipientFontPath = candidates.find((candidate) => candidate && fs.existsSync(candidate));

  if (!recipientFontPath) {
    throw new Error(
      'No Unicode-capable Bengali certificate font was found. Set ' +
        'CERTIFICATE_UNICODE_FONT_PATH to a local .ttf font such as Noto Sans Bengali.'
    );
  }

  return recipientFontPath;
};

const COLORS = Object.freeze({
  forest: '#164A36',
  green: '#2E7D32',
  leaf: '#70A66A',
  gold: '#C9983A',
  goldLight: '#E8D3A1',
  ink: '#26332E',
  muted: '#63736B',
  paper: '#FCFBF4',
  white: '#FFFFFF'
});

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));

const safeFilenamePart = (value) =>
  String(value || 'recipient')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'recipient';

const drawLeaf = (doc, x, y, scale = 1, mirrored = false) => {
  doc.save();
  doc.translate(x, y);
  if (mirrored) doc.scale(-1, 1);

  doc
    .moveTo(0, 0)
    .bezierCurveTo(18 * scale, -25 * scale, 48 * scale, -21 * scale, 58 * scale, -5 * scale)
    .bezierCurveTo(35 * scale, 3 * scale, 16 * scale, 2 * scale, 0, 0)
    .fill(COLORS.leaf);
  doc
    .moveTo(3 * scale, -1 * scale)
    .lineTo(50 * scale, -7 * scale)
    .lineWidth(0.8)
    .strokeColor(COLORS.paper)
    .stroke();
  doc.restore();
};

const drawCornerDecoration = (doc, x, y, rotation) => {
  doc.save().translate(x, y).rotate(rotation);
  doc
    .moveTo(0, 38)
    .lineTo(0, 0)
    .lineTo(38, 0)
    .lineWidth(2)
    .strokeColor(COLORS.gold)
    .stroke();
  doc
    .moveTo(7, 31)
    .lineTo(7, 7)
    .lineTo(31, 7)
    .lineWidth(0.7)
    .strokeColor(COLORS.goldLight)
    .stroke();
  doc.restore();
};

const drawRecipientName = (doc, recipientName, contentLeft, contentWidth) => {
  const name = String(recipientName || '');
  const boxTop = 194;
  const boxHeight = 52;
  const minimumFontSize = 8;
  const options = {
    width: contentWidth,
    align: 'center',
    lineGap: -1
  };

  let fontSize = 35;
  let textHeight;

  doc.font(RECIPIENT_FONT_NAME).fillColor(COLORS.forest);

  do {
    doc.fontSize(fontSize);
    textHeight = doc.heightOfString(name, options);
    if (textHeight <= boxHeight || fontSize === minimumFontSize) break;
    fontSize = Math.max(minimumFontSize, fontSize - 0.5);
  } while (fontSize >= minimumFontSize);

  const nameY = boxTop + Math.max(0, (boxHeight - textHeight) / 2);
  doc.text(name, contentLeft, nameY, options);
};

const drawCertificate = (doc, certificate) => {
  const width = doc.page.width;
  const height = doc.page.height;
  const contentLeft = 74;
  const contentWidth = width - contentLeft * 2;

  doc.rect(0, 0, width, height).fill(COLORS.paper);
  doc
    .roundedRect(22, 22, width - 44, height - 44, 5)
    .lineWidth(3)
    .strokeColor(COLORS.forest)
    .stroke();
  doc
    .roundedRect(29, 29, width - 58, height - 58, 3)
    .lineWidth(1)
    .strokeColor(COLORS.gold)
    .stroke();

  drawCornerDecoration(doc, 42, 42, 0);
  drawCornerDecoration(doc, width - 42, 42, 90);
  drawCornerDecoration(doc, width - 42, height - 42, 180);
  drawCornerDecoration(doc, 42, height - 42, 270);
  drawLeaf(doc, 73, 85, 0.78);
  drawLeaf(doc, width - 73, 85, 0.78, true);

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.forest)
    .text('WASTE2WORTH', contentLeft, 55, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 2.6
    });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.muted)
    .text('ENVIRONMENTAL ACHIEVEMENT PROGRAM', contentLeft, 77, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 1.8
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(31)
    .fillColor(COLORS.ink)
    .text('CERTIFICATE OF RECOGNITION', contentLeft, 112, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 1.2
    });
  doc
    .moveTo(width / 2 - 90, 155)
    .lineTo(width / 2 + 90, 155)
    .lineWidth(1)
    .strokeColor(COLORS.gold)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor(COLORS.muted)
    .text('Proudly presented to', contentLeft, 174, { width: contentWidth, align: 'center' });

  drawRecipientName(doc, certificate.recipientName, contentLeft, contentWidth);

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.muted)
    .text('for reaching the WASTE2WORTH environmental milestone', contentLeft, 252, {
      width: contentWidth,
      align: 'center'
    });
  doc
    .font('Helvetica-Bold')
    .fontSize(25)
    .fillColor(COLORS.green)
    .text(certificate.milestoneTitle, contentLeft, 275, {
      width: contentWidth,
      align: 'center'
    });

  doc
    .font('Helvetica')
    .fontSize(11.5)
    .fillColor(COLORS.ink)
    .text(
      `This achievement recognizes environmental participation and measurable progress in the WASTE2WORTH circular-economy community.`,
      135,
      316,
      { width: width - 270, align: 'center', lineGap: 2 }
    );

  const scoreY = 365;
  doc.roundedRect(width / 2 - 155, scoreY, 310, 42, 21).fill(COLORS.forest);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.white)
    .text(
      `GREEN SCORE AT ISSUANCE: ${Number(certificate.greenPointsAtIssue).toLocaleString('en-US')}`,
      width / 2 - 145,
      scoreY + 8,
      { width: 290, align: 'center' }
    );
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.goldLight)
    .text(
      `Milestone threshold: ${Number(certificate.threshold).toLocaleString('en-US')} Green Points`,
      width / 2 - 145,
      scoreY + 25,
      { width: 290, align: 'center' }
    );

  const detailY = 438;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted);
  doc.text('ISSUED ON', 78, detailY, { width: 200, align: 'left' });
  doc.text('CERTIFICATE ID', width - 278, detailY, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.ink);
  doc.text(formatDate(certificate.issuedAt), 78, detailY + 15, { width: 200, align: 'left' });
  doc
    .font('Helvetica-Bold')
    .text(certificate.certificateId, width - 308, detailY + 15, {
      width: 230,
      align: 'right'
    });

  doc.circle(width / 2, detailY + 22, 34).lineWidth(2).strokeColor(COLORS.gold).stroke();
  doc.circle(width / 2, detailY + 22, 27).lineWidth(0.7).strokeColor(COLORS.green).stroke();
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.forest)
    .text('W2W', width / 2 - 25, detailY + 11, { width: 50, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(6)
    .text('VERIFIED', width / 2 - 25, detailY + 27, {
      width: 50,
      align: 'center',
      characterSpacing: 1
    });

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(`Verify: ${certificate.verificationUrl}`, 92, 512, {
      width: width - 184,
      align: 'center',
      ellipsis: true
    });
  doc
    .fontSize(6.8)
    .fillColor('#7A857F')
    .text(
      'Issued by WASTE2WORTH as platform recognition of an environmental achievement. This is not a legal or government certification.',
      92,
      530,
      { width: width - 184, align: 'center' }
    );
};

const PDFGenerator = {
  createDocument(certificate) {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: `${certificate.milestoneTitle} - ${certificate.recipientName}`,
        Author: 'WASTE2WORTH',
        Subject: 'WASTE2WORTH Environmental Achievement Certificate',
        Keywords: 'WASTE2WORTH, environmental achievement, green points, certificate',
        CreationDate: new Date(certificate.issuedAt)
      }
    });

    doc.registerFont(RECIPIENT_FONT_NAME, findRecipientFontPath());
    drawCertificate(doc, certificate);
    return doc;
  },

  generateCertificate(res, certificate) {
    const doc = this.createDocument(certificate);
    const filename = `${safeFilenamePart(certificate.recipientName)}_${safeFilenamePart(
      certificate.milestoneTitle
    )}_${certificate.certificateId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    doc.pipe(res);
    doc.end();
  }
};

module.exports = PDFGenerator;
