import React, { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/userService";
import {
  MdNotifications,
  MdCheckCircle,
  MdInfo,
  MdWarning,
  MdError,
} from "react-icons/md";
import { formatDistanceToNow } from "date-fns";

const Notifications = ({ title = "Notifications" }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    const result = await getNotifications(userId);
    if (result.success) {
      setNotifications(result.data);
    }
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <MdCheckCircle className="w-6 h-6 text-green-500" />;
      case "warning":
        return <MdWarning className="w-6 h-6 text-orange-500" />;
      case "error":
        return <MdError className="w-6 h-6 text-red-500" />;
      default:
        return <MdInfo className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <MdNotifications className="text-blue-600" /> {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View all your system {title.toLowerCase()}
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors font-medium"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <MdNotifications className="w-8 h-8 text-gray-300 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No {title.toLowerCase()} found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id)}
                className={`p-6 flex gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                  !notif.is_read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4
                      className={`text-base font-semibold ${
                        !notif.is_read
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notif.message}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="shrink-0 self-center">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
