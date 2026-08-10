const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'w2w_super_secret_key_change_in_production';

/* ── Role → dashboard redirect helper ───────────────────── */
function getRedirectUrl(role) {
  if (!role) return '/storefront';
  const r = role.toString().trim().toLowerCase();
  if (r === 'citizen') return '/dashboard/citizen';
  if (r === 'volunteer') return '/dashboard/volunteer';
  if (r === 'bhangarishop' || r === 'bhangari') return '/dashboard/bhangari';
  if (r === 'creator') return '/dashboard/creator';
  if (r === 'admin') return '/dashboard/admin';
  return '/storefront';
}

const AuthController = {
  /* ── Register ──────────────────────────────────────────── */
  async register(req, res) {
    try {
      let { name, email, password, role } = req.body;

      name = (name || '').trim();
      email = (email || '').trim().toLowerCase();

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const validRoles = ['Citizen', 'Volunteer', 'BhangariShop', 'Creator', 'Admin'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user   = await UserModel.create({ name, email, password: hashed, role: role || 'Citizen' });

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      res.status(201).json({
        message:  'Registration successful',
        redirect: getRedirectUrl(user.role)
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  },

  /* ── Login ─────────────────────────────────────────────── */
  async login(req, res) {
    try {
      let { email, password } = req.body;
      email = (email || '').trim().toLowerCase();

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      res.json({
        message:  'Login successful',
        redirect: getRedirectUrl(user.role)
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  },

  /* ── Logout ────────────────────────────────────────────── */
  logout(_req, res) {
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out successfully', redirect: '/login' });
  },

  /* ── Current user profile ──────────────────────────────── */
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },

  /* ── Update Role ───────────────────────────────────────── */
  async updateRole(req, res) {
    try {
      const { role } = req.body;
      const validRoles = ['Citizen', 'Volunteer', 'BhangariShop', 'Creator'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected' });
      }

      // Update role in DB
      await UserModel.updateRole(req.user.id, role);

      // Fetch updated user to reissue token
      const user = await UserModel.findById(req.user.id);
      
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      res.json({ message: `Successfully upgraded to ${role}!`, redirect: getRedirectUrl(user.role) });
    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
};

module.exports = AuthController;

