const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from HttpOnly cookie.
 * Attaches decoded user payload to req.user on success.
 */
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.redirect('/login');
  }
};

/**
 * Optional authentication — attaches user if token is present
 * but does not block unauthenticated requests.
 */
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Silently ignore invalid tokens for optional auth
    }
  }
  next();
};

module.exports = { verifyToken, optionalAuth };
