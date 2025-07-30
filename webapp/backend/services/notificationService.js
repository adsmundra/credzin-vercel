const nodemailer = require('nodemailer');
const axios = require('axios');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.emailTransporter = this.createEmailTransporter();
  }

  // Email transporter setup
  createEmailTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Create notification in database
  async createNotification(userId, type, title, message, channels = {}, metadata = {}, actions = []) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        channels: {
          inApp: channels.inApp !== false, // Default to true
          email: channels.email || false,
          whatsapp: channels.whatsapp || false
        },
        metadata,
        actions,
        status: actions.length > 0 ? 'action_required' : 'pending'
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send in-app notification
  async sendInAppNotification(notification) {
    try {
      // For real-time notifications, you might want to use WebSockets
      // For now, we'll just mark it as sent
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
      
      return { success: true, channel: 'inApp' };
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return { success: false, channel: 'inApp', error: error.message };
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: notification.title,
        html: this.createEmailTemplate(notification)
      };

      await this.emailTransporter.sendMail(mailOptions);
      
      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
      
      return { success: true, channel: 'email' };
    } catch (error) {
      console.error('Error sending email notification:', error);
      notification.status = 'failed';
      await notification.save();
      return { success: false, channel: 'email', error: error.message };
    }
  }

  // Send WhatsApp notification using WhatsApp Business API
  async sendWhatsAppNotification(notification) {
    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.contact) {
        throw new Error('User contact not found');
      }

      // Using WhatsApp Business API (you'll need to set up with a provider like Twilio)
      const whatsappMessage = {
        messaging_product: "whatsapp",
        to: user.contact,
        type: "text",
        text: {
          body: `${notification.title}\n\n${notification.message}`
        }
      };

      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        whatsappMessage,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();
      
      return { success: true, channel: 'whatsapp' };
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      notification.status = 'failed';
      await notification.save();
      return { success: false, channel: 'whatsapp', error: error.message };
    }
  }

  // Send notification through all specified channels
  async sendNotification(userId, type, title, message, channels = {}, metadata = {}, actions = []) {
    try {
      // Create notification in database
      const notification = await this.createNotification(userId, type, title, message, channels, metadata, actions);
      
      const results = [];

      // Send through specified channels
      if (notification.channels.inApp) {
        results.push(await this.sendInAppNotification(notification));
      }

      if (notification.channels.email) {
        results.push(await this.sendEmailNotification(notification));
      }

      if (notification.channels.whatsapp) {
        results.push(await this.sendWhatsAppNotification(notification));
      }

      return {
        notificationId: notification._id,
        results
      };
    } catch (error) {
      console.error('Error in sendNotification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
      
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { 
          status: 'read',
          readAt: new Date(),
          actions: [] // Clear actions when marked as read
        },
        { new: true }
      );
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, status: { $ne: 'read' } },
        { 
          status: 'read',
          readAt: new Date()
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        status: { $ne: 'read' }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Create email template
  createEmailTemplate(notification) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CredZin</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
            </div>
            <div class="footer">
              <p>This is an automated message from CredZin. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Predefined notification templates
  static getNotificationTemplates() {
    return {
      card_recommendation: {
        title: 'New Card Recommendations Available!',
        message: 'We have new personalized credit card recommendations for you based on your preferences.',
        channels: { inApp: true, email: true, whatsapp: false }
      },
      group_invite: {
        title: 'You\'ve been invited to a Card Pool!',
        message: 'Someone has invited you to join their card pool. Check it out!',
        channels: { inApp: true, email: true, whatsapp: true }
      },
      card_added: {
        title: 'Card Added Successfully!',
        message: 'Your card has been added to your collection.',
        channels: { inApp: true, email: false, whatsapp: false }
      },
      card_removed: {
        title: 'Card Removed Successfully!',
        message: 'Your card has been removed from your collection.',
        channels: { inApp: true, email: false, whatsapp: false }
      },
      system_alert: {
        title: 'System Alert',
        message: 'Important system update or maintenance notification.',
        channels: { inApp: true, email: true, whatsapp: true }
      },
      reminder: {
        title: 'Reminder',
        message: 'Don\'t forget to check your card recommendations!',
        channels: { inApp: true, email: true, whatsapp: false }
      }
    };
  }


  createEmailTemplate(notification) {
    const acceptButton = notification.metadata.acceptLink 
        ? `<a href="${notification.metadata.acceptLink}" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; margin-right: 10px;">Accept</a>`
        : '';
    const rejectButton = notification.metadata.rejectLink 
        ? `<a href="${notification.metadata.rejectLink}" style="display: inline-block; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none;">Reject</a>`
        : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button-container { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CredZin</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              <div class="button-container">
                ${acceptButton}
                ${rejectButton}
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from CredZin. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
}
}

// In NotificationService class


module.exports = new NotificationService(); 