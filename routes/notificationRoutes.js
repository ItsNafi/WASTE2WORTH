const express = require('express');
const router = express.Router();
const NotificationModel = require('../models/notificationModel');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await NotificationModel.findByUser(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/mark-read', verifyToken, async (req, res) => {
  try {
    await NotificationModel.markAllAsRead(req.user.id);
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
