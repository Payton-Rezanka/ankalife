// Regenerates the survey QR codes. Run: node build-qr.js
const QRCode = require('qrcode');

const SURVEY_URL = 'https://ankalifeleads.com/?goto=survey';

// High-contrast, brand-dark foreground on white for maximum scannability.
const opts = {
  errorCorrectionLevel: 'H', // tolerates logos/print wear; ~30% recoverable
  margin: 4,                 // quiet zone — keep it; scanners need the white border
  color: { dark: '#082a2b', light: '#ffffff' },
};

(async () => {
  // 1024px PNG — great for screens, social, slides
  await QRCode.toFile('qr-survey.png', SURVEY_URL, { ...opts, width: 1024, type: 'png' });
  // Vector SVG — scales to any print size (flyers, yard signs, banners) with no blur
  await QRCode.toFile('qr-survey.svg', SURVEY_URL, { ...opts, type: 'svg' });
  console.log('Wrote qr-survey.png (1024px) and qr-survey.svg →', SURVEY_URL);
})().catch(e => { console.error(e); process.exit(1); });
