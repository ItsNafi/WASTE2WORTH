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
const recyclingHistoryRoutes = require('./routes/recyclingHistoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const volunteerRoutes    = require('./routes/volunteerRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const { driveRouter, wasteLogRouter, wasteRequestRouter } = require('./routes/wastePortalRoutes');

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

const jwt = require('jsonwebtoken');

/* ── Role Guards & Authenticated Redirects ───────────────── */
const getDashboardRoute = (role) => {
  if (!role) return '/storefront';
  const r = role.toString().trim().toLowerCase();
  if (r === 'citizen') return '/dashboard/citizen';
  if (r === 'volunteer') return '/dashboard/volunteer';
  if (r === 'bhangarishop' || r === 'bhangari') return '/dashboard/bhangari';
  if (r === 'creator') return '/dashboard/creator';
  if (r === 'admin') return '/dashboard/admin';
  return '/storefront';
};

const redirectIfAuthenticated = (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'w2w_super_secret_key_change_in_production');
      if (decoded && decoded.role) {
        return res.redirect(getDashboardRoute(decoded.role));
      }
    } catch (err) {
      res.clearCookie('token', { path: '/' });
    }
  }
  next();
};

const requirePageRole = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) return next();
  res.status(403).send('<h2>403 Forbidden</h2><p>Access denied for your role.</p><a href="/login">Back to Login</a>');
};

/* ── Page Routes (HTML Views) ────────────────────────────── */
app.get('/', redirectIfAuthenticated, (req, res) => res.redirect('/login'));
app.get('/login', redirectIfAuthenticated, serveView('auth/login.html'));
app.get('/register', redirectIfAuthenticated, serveView('auth/register.html'));

app.get('/dashboard/citizen', verifyToken, requirePageRole('Citizen'), serveView('citizen/scrapForm.html'));
app.get('/dashboard/citizen/pollution', verifyToken, requirePageRole('Citizen'), serveView('citizen/pollutionForm.html'));
app.get('/dashboard/bhangari', verifyToken, requirePageRole('BhangariShop'), serveView('bhangari/board.html'));
app.get('/dashboard/creator', verifyToken, requirePageRole('Creator'), serveView('creator/rawMaterials.html'));
app.get('/dashboard/creator/crafts/new', verifyToken, requirePageRole('Creator'), serveView('creator/craftForm.html'));
app.get('/dashboard/volunteer', verifyToken, requirePageRole('Volunteer'), serveView('volunteer/campaigns.html'));
app.get('/dashboard/volunteer/waste-portal', verifyToken, requirePageRole('Volunteer'), serveView('volunteer/wastePortal.html'));
app.get('/dashboard/volunteer/product-story', verifyToken, requirePageRole('Volunteer'), serveView('volunteer/productStory.html'));
app.get('/dashboard/admin', verifyToken, requirePageRole('Admin'), serveView('admin/dashboard.html'));
app.get('/dashboard/admin/volunteers', verifyToken, requirePageRole('Admin'), serveView('admin/volunteers.html'));
app.get('/dashboard/admin/campaign-qr', verifyToken, requirePageRole('Admin'), serveView('admin/campaign-qr.html'));

/* ── Volunteer Registration (any logged-in user) ─────────────── */
app.get('/volunteer/register', verifyToken, serveView('volunteer/register.html'));
app.get('/volunteer/profile',  verifyToken, serveView('volunteer/profile.html'));
app.get('/volunteer/scan', verifyToken, serveView('volunteer/scan.html'));

app.get('/storefront', serveView('storefront/crafts.html'));
app.get('/creator-profile/:id', serveView('creator-profile.html'));
app.get('/payments/transactions', verifyToken, serveView('payments/transactions.html'));

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
app.use('/api/history',   recyclingHistoryRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/volunteers',    volunteerRoutes);
app.use('/api',               attendanceRoutes);
app.use('/api/drives',          driveRouter);
app.use('/api/waste-logs',      wasteLogRouter);
app.use('/api/waste-requests',  wasteRequestRouter);

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
