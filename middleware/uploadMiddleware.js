const multer = require('multer');
const path  = require('path');

/* ── Disk storage configuration ──────────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});

/* ── Allow only common image types ───────────────────────── */
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

/* ── Single scrap photo upload ───────────────────────────── */
const uploadScrapPhoto = multer({ storage, fileFilter, limits }).single('photo');

/* ── Dual craft photo upload (before + after) ────────────── */
const uploadCraftPhotos = multer({ storage, fileFilter, limits }).fields([
  { name: 'beforePhoto', maxCount: 1 },
  { name: 'afterPhoto',  maxCount: 1 }
]);

module.exports = { uploadScrapPhoto, uploadCraftPhotos };
