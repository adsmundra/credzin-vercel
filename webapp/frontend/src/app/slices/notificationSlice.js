import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (action.payload.status !== 'read') {
        state.unreadCount += 1;
      }
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        n => n._id === action.payload
      );
      if (notification && notification.status !== 'read') {
        notification.status = 'read';
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.status = 'read';
        notification.readAt = new Date().toISOString();
      });
      state.unreadCount = 0;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setNotifications,
  setUnreadCount,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setLoading,
  setError,
  clearError
} = notificationSlice.actions;

export default notificationSlice.reducer; 