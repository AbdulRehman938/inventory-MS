import React from "react";
import { MdNotifications, MdClose, MdSnooze } from "react-icons/md";

const ReminderNotification = ({ reminder, onAcknowledge, onSnooze }) => {
  return (
    <div className="fixed top-4 left-[38%] -translate-x-1/2 z-[9999] animate-slideInDown">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl shadow-2xl p-5 min-w-[400px] max-w-md border-2 border-yellow-300">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-full animate-pulse">
            <MdNotifications className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Reminder Alert!</h3>
            <p className="text-sm opacity-90 mb-3">{reminder.text}</p>
            <p className="text-xs opacity-75 font-mono">
              Scheduled: {new Date(reminder.dateTime).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onSnooze}
            className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm"
          >
            <MdSnooze className="w-4 h-4" />
            Snooze 5 min
          </button>
          <button
            onClick={onAcknowledge}
            className="flex-1 bg-white text-orange-600 hover:bg-gray-100 px-4 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-sm"
          >
            <MdClose className="w-4 h-4" />
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderNotification;
