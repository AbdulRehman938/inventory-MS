import React, { useState, useEffect, useRef } from "react";
import { MdNotifications, MdNotificationsNone, MdCircle } from "react-icons/md";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/userService";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = ({ userId, onSwitchTab }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Poll for new notifications every 5 seconds (faster real-time)
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    const result = await getNotifications(userId);
    if (result.success) {
      setNotifications(result.data);
      const unread = result.data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  const handleToggle = () => setIsOpen(!isOpen);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
      fetchNotifications(); // Refresh to update unread count
    }
    setIsOpen(false);

    if (notif.link) {
      try {
        const linkData = JSON.parse(notif.link);
        if (linkData.tab && onSwitchTab) {
          onSwitchTab(linkData.tab, linkData.id); // Pass tab AND optional ID
        }
      } catch (e) {
        console.error("Failed to parse notification link", e);
        if (onSwitchTab) onSwitchTab("notifications");
      }
    } else if (onSwitchTab) {
      // Find ID for "Notifications" or "Alerts" tab essentially
      // We might need to pass the actual ID string, or generic "notifications"
      onSwitchTab("notifications");
    }
  };

  const handleSeeAll = () => {
    setIsOpen(false);
    if (onSwitchTab) onSwitchTab("notifications");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-300"
      >
        {unreadCount > 0 ? (
          <MdNotifications className="w-6 h-6 text-blue-600" />
        ) : (
          <MdNotificationsNone className="w-6 h-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-fadeIn">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  await markAllNotificationsRead(userId);
                  fetchNotifications();
                }}
                className="text-xs text-blue-600 font-medium hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 4).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    !notif.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        !notif.is_read ? "bg-blue-500" : "bg-transparent"
                      }`}
                    ></div>
                    <div>
                      <h4
                        className={`text-sm font-medium ${
                          !notif.is_read
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
            <button
              onClick={handleSeeAll}
              className="w-full py-2 text-sm text-center text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              See all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
