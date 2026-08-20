const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Route to generate QR code for a campaign
router.get('/campaigns/:id/qr-code', attendanceController.generateQR);

// Route to scan QR code and mark attendance
router.post('/attendance/scan', attendanceController.scanAttendance);

module.exports = router;
