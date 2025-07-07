import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setNotifications,
  setUnreadCount,
} from "../app/slices/notificationSlice";
import { apiEndpoint } from "../api";
import axios from "axios";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(
    (state) => state.notifications
  );
  const token = localStorage.getItem("token");

  // Handle click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${apiEndpoint}/api/v1/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        dispatch(setNotifications(response.data.notifications));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${apiEndpoint}/api/v1/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        dispatch(setUnreadCount(response.data.unreadCount));
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      await axios.put(
        `${apiEndpoint}/api/v1/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await axios.put(
        `${apiEndpoint}/api/v1/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle action button clicks
  const handleAction = async (action, notificationId) => {
    if (!token) return;

    setActionLoading((prev) => ({ ...prev, [notificationId]: true }));

    try {
      let url = "";

      // Extract invitation ID from the action URL
      if (
        action.action === "accept_invitation" ||
        action.action === "reject_invitation"
      ) {
        const urlParts = action.url.split("/");
        const invitationId = urlParts[urlParts.length - 2]; // Get the invitation ID
        const actionType =
          action.action === "accept_invitation" ? "accept" : "reject";
        url = `${apiEndpoint}/api/v1/group/invitation/${invitationId}/${actionType}`;
      } else {
        url = `${apiEndpoint}${action.url}`;
      }

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`Action ${action.action} completed successfully`);

        //  Mark as read in backend
        await axios.put(
          `${apiEndpoint}/api/v1/notifications/${notificationId}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // ✅ Update notification in Redux to hide buttons & remove blue dot
        const updatedNotifications = notifications.map((n) =>
          n._id === notificationId ? { ...n, actions: [], status: "read" } : n
        );
        dispatch(setNotifications(updatedNotifications));

        // ✅ Refresh unread count
        fetchUnreadCount();
      }
    } catch (error) {
      console.error(`Error performing action ${action.action}:`, error);
      // You might want to show an error toast here
    } finally {
      setActionLoading((prev) => ({ ...prev, [notificationId]: false }));
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "card_recommendation":
        return "💳";
      case "group_invite":
        return "👥";
      case "group_join":
        return "✅";
      case "group_reject":
        return "❌";
      case "card_added":
        return "✅";
      case "system_alert":
        return "⚠️";
      case "reminder":
        return "⏰";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a.75.75 0 0 1-.75 1.25H3a.75.75 0 0 1-.75-.75L4.5 14.25V9.75a6 6 0 0 1 6-6Z"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#111518] rounded-lg shadow-lg border border-gray-200 z-50 md:right-0 right-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    notification.status === "read" ? "opacity-75" : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>

                      {/* Action Buttons */}
                      {notification.actions &&
                        notification.actions.length > 0 && (
                          <div className="flex space-x-2 mt-3">
                            {notification.actions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() =>
                                  handleAction(action, notification._id)
                                }
                                disabled={actionLoading[notification._id]}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                  action.action === "accept_invitation"
                                    ? "bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300"
                                    : action.action === "reject_invitation"
                                    ? "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300"
                                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
                                }`}
                              >
                                {actionLoading[notification._id]
                                  ? "Loading..."
                                  : action.label}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    {notification.status !== "read" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Click to mark as read (only if no actions) */}
                  {(!notification.actions ||
                    notification.actions.length === 0) && (
                    <div
                      className="cursor-pointer"
                      onClick={() => markAsRead(notification._id)}
                    >
                      <div className="text-xs text-gray-400 mt-2">
                        Click to mark as read
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
