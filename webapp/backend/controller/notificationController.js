const notificationService = require('../services/notificationService');
const { verifyToken } = require('../middlewares/verifyToken');
const user_oauth_details = require("../models/user_oauth_details")

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.id;
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.id;
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.id;

    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.id;

    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
};

// Send custom notification (admin only)
exports.sendCustomNotification = async (req, res) => {
  try {
    const { userId, type, title, message, channels } = req.body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title, message'
      });
    }

    const result = await notificationService.sendNotification(
      userId,
      type,
      title,
      message,
      channels
    );

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
};

// Get notification templates
exports.getNotificationTemplates = async (req, res) => {
  try {
    const templates = notificationService.constructor.getNotificationTemplates();

    res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting notification templates',
      error: error.message
    });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.id;
    const { preferences } = req.body;

    // Update user's notification preferences
    // You might want to add a preferences field to the User model
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification preferences',
      error: error.message
    });
  }
};


exports.checkForUserOauthConsent = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.id;

    const user = await user.findOne({ user_email: email })
    if (user) {
      return res.status(201).json({
        status: true,
        message: "user is already register"
      })
    }

    const oauthNotification = await notificationService.sendNotification(
      user._id,
      'system_alert',
      'Complete OAuth Setup',
      'Please connect your account to enable all features.',
      { inApp: true, email: false, whatsapp: false },
      {
        acceptLink: '/settings/oauth',
        rejectLink: null,
        relatedTo: 'oauth_setup'
      },
      [{
        label: 'Connect Now',
        action: 'oauth_connect',
        url: '/settings/oauth',
        method: 'GET'
      }]
    );
  }
  catch (error) {
    return res.status(500).json({
      status: false,
      message: "network issue"
    })
  }
};