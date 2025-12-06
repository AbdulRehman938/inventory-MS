import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
import RoleSwitcher from "../components/RoleSwitcher";

const DashboardLayout = ({ role, sidebarItems }) => {
  const [activeTabId, setActiveTabId] = useState(sidebarItems[0]?.id);
  const navigate = useNavigate();

  const activeItem = sidebarItems.find((item) => item.id === activeTabId);
  const ActiveComponent =
    activeItem?.component || (() => <div className="p-4">Page Not Found</div>);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
            IMS
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide">Inventory MS</h2>
            <p className="text-xs text-slate-400 capitalize font-medium">
              {role} Dashboard
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTabId(item.id)}
              className={`w-full flex items-center px-6 py-3.5 text-left transition-all duration-200 group relative ${
                activeTabId === item.id
                  ? "bg-blue-600/10 text-blue-400 border-r-4 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <span
                className={`mr-3 transition-transform duration-200 ${
                  activeTabId === item.id
                    ? "scale-110"
                    : "group-hover:scale-110"
                }`}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>

              {/* Active Indicator Glow */}
              {activeTabId === item.id && (
                <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
              {role[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate capitalise">
                {role}
              </p>
              <p className="text-xs text-slate-500 truncate">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {activeItem?.label}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <RoleSwitcher currentRole={role} />
            <div className="h-6 w-px bg-gray-300"></div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-red-600 transition-colors font-medium text-sm gap-2"
            >
              <MdLogout className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
