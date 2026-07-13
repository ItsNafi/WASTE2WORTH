const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.get('/logout',    AuthController.logout);
router.get('/me',        verifyToken, AuthController.me);
router.put('/role',      verifyToken, AuthController.updateRole);

module.exports = router;
