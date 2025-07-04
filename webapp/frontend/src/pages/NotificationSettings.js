import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { apiEndpoint } from "../api";
import axios from "axios";

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    card_recommendation: { inApp: true, email: true, whatsapp: false },
    group_invite: { inApp: true, email: true, whatsapp: true },
    card_added: { inApp: true, email: false, whatsapp: false },
    system_alert: { inApp: true, email: true, whatsapp: true },
    reminder: { inApp: true, email: true, whatsapp: false },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const user = useSelector((state) => state.auth.user);
  const token = localStorage.getItem("token");

  const notificationTypes = {
    card_recommendation: {
      title: "Card Recommendations",
      description:
        "Get notified when new credit card recommendations are available",
    },
    group_invite: {
      title: "Group Invites",
      description: "Notifications when someone invites you to join a card pool",
    },
    card_added: {
      title: "Card Management",
      description:
        "Notifications when you add or remove cards from your collection",
    },
    system_alert: {
      title: "System Alerts",
      description: "Important system updates and maintenance notifications",
    },
    reminder: {
      title: "Reminders",
      description: "Periodic reminders to check your card recommendations",
    },
  };

  const handleDisableAll = () => {
    const newPreferences = {};
    Object.keys(preferences).forEach((type) => {
      newPreferences[type] = {
        inApp: false,
        email: false,
        whatsapp: false,
      };
    });
    setPreferences(newPreferences);
  };

  const updatePreference = (type, channel, value) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value,
      },
    }));
  };

  const savePreferences = async () => {
    if (!token) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.put(
        `${apiEndpoint}/api/v1/notifications/preferences`,
        { preferences },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setMessage("Preferences saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setMessage("Error saving preferences. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (channel, value) => {
    const newPreferences = {};
    Object.keys(preferences).forEach((type) => {
      newPreferences[type] = {
        ...preferences[type],
        [channel]: value,
      };
    });
    setPreferences(newPreferences);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notification Settings
            </h1>
            <p className="text-gray-600">
              Manage how you receive notifications from CredZin
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes("Error")
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => toggleAll("inApp", true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable All In-App
              </button>
              <button
                onClick={() => toggleAll("email", true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Enable All Email
              </button>
              <button
                onClick={() => toggleAll("whatsapp", true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Enable All WhatsApp
              </button>
              <button
                onClick={
                  // toggleAll('inApp', false);
                  // toggleAll('email', false);
                  // toggleAll('whatsapp', false);
                  handleDisableAll
                }
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Disable All
              </button>
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-6">
            {Object.entries(notificationTypes).map(([type, config]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {config.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{config.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* In-App Notifications */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📱</span>
                      <div>
                        <p className="font-medium text-gray-900">In-App</p>
                        <p className="text-xs text-gray-500">
                          Push notifications
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[type].inApp}
                        onChange={(e) =>
                          updatePreference(type, "inApp", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📧</span>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-xs text-gray-500">
                          Send to {user?.email}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[type].email}
                        onChange={(e) =>
                          updatePreference(type, "email", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* WhatsApp Notifications */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💬</span>
                      <div>
                        <p className="font-medium text-gray-900">WhatsApp</p>
                        <p className="text-xs text-gray-500">
                          Send to {user?.contact}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[type].whatsapp}
                        onChange={(e) =>
                          updatePreference(type, "whatsapp", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={savePreferences}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
