require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');

const authRoutes     = require('./routes/authRoutes');
const scrapRoutes    = require('./routes/scrapRoutes');
const bhangariRoutes = require('./routes/bhangariRoutes');
const creatorRoutes  = require('./routes/creatorRoutes');
const craftRoutes    = require('./routes/craftRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const pollutionRoutes = require('./routes/pollutionRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const rewardRoutes   = require('./routes/rewardRoutes');

const { verifyToken } = require('./middleware/authMiddleware');

const app = express();

/* ── Middleware ──────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* ── View Helper (Server-Side HTML without Engine) ───────── */
const serveView = (viewPath) => (req, res) => {
  const absolutePath = path.join(__dirname, 'views', viewPath);
  try {
    const html = fs.readFileSync(absolutePath, 'utf8');
    res.type('html').send(html);
  } catch (err) {
    console.error('View not found:', absolutePath, err.message);
    res.status(404).send('<h2>404</h2><p>View not found.</p>');
  }
};

/* ── Role Guards for Page Routes ─────────────────────────── */
const requirePageRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) return next();
  res.status(403).send('<h2>403 Forbidden</h2><p>Access denied for your role.</p><a href="/login">Back to Login</a>');
};

/* ── Page Routes (HTML Views) ────────────────────────────── */
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', serveView('auth/login.html'));
app.get('/register', serveView('auth/register.html'));

app.get('/dashboard/citizen', verifyToken, requirePageRole('Citizen'), serveView('citizen/scrapForm.html'));
app.get('/dashboard/citizen/pollution', verifyToken, requirePageRole('Citizen'), serveView('citizen/pollutionForm.html'));
app.get('/dashboard/bhangari', verifyToken, requirePageRole('BhangariShop'), serveView('bhangari/board.html'));
app.get('/dashboard/creator', verifyToken, requirePageRole('Creator'), serveView('creator/rawMaterials.html'));
app.get('/dashboard/creator/crafts/new', verifyToken, requirePageRole('Creator'), serveView('creator/craftForm.html'));
app.get('/dashboard/volunteer', verifyToken, requirePageRole('Volunteer'), serveView('volunteer/campaigns.html'));
app.get('/dashboard/admin', verifyToken, requirePageRole('Admin'), serveView('admin/dashboard.html'));

app.get('/storefront', serveView('storefront/crafts.html'));

/* ── API Routes ──────────────────────────────────────────── */
app.use('/api/auth',      authRoutes);
app.use('/api/scrap',     scrapRoutes);
app.use('/api/bhangari',  bhangariRoutes);
app.use('/api/creator',   creatorRoutes);
app.use('/api/crafts',    craftRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/pollution', pollutionRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/rewards',   rewardRoutes);

/* ── Global Error Handler ────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

/* ── 404 Handler ─────────────────────────────────────────── */
app.use((req, res) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not Found' });
  }

  res.status(404).send('<h2>404 Not Found</h2><p>The page or API endpoint does not exist.</p>');
});

/* ── Server Startup ──────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WASTE2WORTH server running on http://localhost:${PORT}`);
});
