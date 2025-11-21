import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const RoleSwitcher = ({ currentRole }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    // Get all roles from localStorage
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    setAvailableRoles(userRoles);
  }, []);

  const handleRoleSwitch = (role) => {
    if (role === currentRole) {
      setShowDropdown(false);
      return;
    }

    // Update current role in localStorage
    localStorage.setItem('userRole', role);
    
    // Navigate to the new dashboard
    if (role === 'admin') {
      toast.success('Switched to Admin Dashboard');
      navigate('/admin/dashboard');
    } else if (role === 'controller') {
      toast.success('Switched to Controller Dashboard');
      navigate('/controller/dashboard');
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
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12M8 12h12m-12 5h12M3 7h.01M3 12h.01M3 17h.01"
          />
        </svg>
        <span className="capitalize">{currentRole}</span>
        <svg
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                Switch Dashboard
              </div>
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                    role === currentRole ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="capitalize font-medium">{role}</span>
                  {role === currentRole && (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
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
