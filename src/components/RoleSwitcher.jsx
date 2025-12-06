import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdSwapHoriz, MdExpandMore, MdCheck } from "react-icons/md";

const RoleSwitcher = ({ currentRole }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    // Get all roles from localStorage
    const userRoles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    setAvailableRoles(userRoles.filter((role) => role !== "theme_pro"));
  }, []);

  const handleRoleSwitch = (role) => {
    if (role === currentRole) {
      setShowDropdown(false);
      return;
    }

    // Update current role in localStorage
    localStorage.setItem("userRole", role);

    // Navigate to the new dashboard
    if (role === "admin") {
      toast.success("Switched to Admin Dashboard");
      navigate("/admin/dashboard");
    } else if (role === "controller") {
      toast.success("Switched to Controller Dashboard");
      navigate("/controller/dashboard");
    }

    setShowDropdown(false);
  };

  // Don't show switcher if user has only one role
  if (availableRoles.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <MdSwapHoriz className="w-5 h-5" />
        <span className="capitalize">{currentRole}</span>
        <MdExpandMore
          className={`w-4 h-4 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Switch Dashboard
              </div>
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${
                    role === currentRole
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <span className="capitalize font-medium">{role}</span>
                  {role === currentRole && <MdCheck className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoleSwitcher;
