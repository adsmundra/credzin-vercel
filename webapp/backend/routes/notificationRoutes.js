const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendCustomNotification,
  getNotificationTemplates,
  updateNotificationPreferences,
  checkForUserOauthConsent
} = require('../controller/notificationController');

// Get user notifications
router.get('/', verifyToken, getNotifications);

// Mark notification as read
router.put('/:notificationId/read', verifyToken, markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', verifyToken, markAllAsRead);

// Get unread notification count
router.get('/unread-count', verifyToken, getUnreadCount);

// Get notification templates
router.get('/templates', verifyToken, getNotificationTemplates);

// Update notification preferences
router.put('/preferences', verifyToken, updateNotificationPreferences);

// Send custom notification (admin only - you might want to add admin middleware)
router.post('/send', verifyToken, sendCustomNotification);


router.post("/checkForUserOauthConsent",verifyToken,checkForUserOauthConsent)

module.exports = router; 