import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdLogout, MdPerson, MdFormatQuote } from "react-icons/md";
import { toast } from "react-toastify";
import RoleSwitcher from "../components/RoleSwitcher";
import ProfileModal from "../components/ProfileModal";
import BiodataModal from "../components/BiodataModal";
import NotificationDropdown from "../components/NotificationDropdown";
import {
  getCurrentUserProfile,
  getUnreadNotifications,
} from "../services/userService";

const DashboardLayout = ({ role, sidebarItems = [], children }) => {
  const [activeTabId, setActiveTabId] = useState(sidebarItems?.[0]?.id || null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBiodataModal, setShowBiodataModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [quote, setQuote] = useState("");
  const [requestsHighlightId, setRequestsHighlightId] = useState(null);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const activeItem = sidebarItems?.find((item) => item.id === activeTabId);
  const ActiveComponent =
    activeItem?.component || (() => <div className="p-4">Page Not Found</div>);

  const handleSwitchTab = (tabId, highlightId = null) => {
    setActiveTabId(tabId);
    if (highlightId) {
      setRequestsHighlightId(highlightId);
    }
  };

  const quotes = [
    "Quality means doing it right when no one is looking.",
    "The only way to do great work is to love what you do.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Productivity is never an accident. It is always the result of a commitment to excellence.",
    "Your limitation—it's only your imagination.",
    "Inventory is money sitting around in another form.",
    "Great things never come from comfort zones.",
    "Efficiency is doing things right; effectiveness is doing the right things.",
    "The secret of getting ahead is getting started.",
    "Focus on being productive instead of busy.",
    "Organization isn't about perfection; it's about efficiency.",
  ];

  // Helper to apply theme
  const applyTheme = (theme) => {
    // Default to 'light' (Default Blue) if undefined or null
    const currentTheme = theme || "light";

    document.body.classList.remove(
      "theme-ocean",
      "theme-sunset",
      "theme-forest",
      "theme-white"
    );
    document.documentElement.classList.remove("dark");

    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (["ocean", "sunset", "forest", "white"].includes(currentTheme)) {
      document.body.classList.add(`theme-${currentTheme}`);
    }
  };

  useEffect(() => {
    // Initial random quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Rotate quote every 60 seconds
    const interval = setInterval(() => {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 1. Load theme on mount from LocalStorage first for speed
    const savedTheme = localStorage.getItem("theme");
    applyTheme(savedTheme);

    // 2. Load User Data & Refresh Roles & Theme from DB
    if (userId) {
      // Load Avatar locally first
      const extras = JSON.parse(
        localStorage.getItem(`user_extras_${userId}`) || "{}"
      );
      if (extras.avatarUrl) setAvatarUrl(extras.avatarUrl);

      // Fetch fresh roles/profile from DB
      getCurrentUserProfile(userId).then((result) => {
        if (result.success) {
          const dbData = result.data;

          if (dbData.role) {
            localStorage.setItem("userRoles", JSON.stringify(dbData.role));
          }
          if (dbData.avatar_url && dbData.avatar_url !== avatarUrl) {
            setAvatarUrl(dbData.avatar_url);
          }
          if (dbData.full_name) setUserName(dbData.full_name);
          if (dbData.email) setUserEmail(dbData.email);
          if (dbData.location) setUserLocation(dbData.location);

          // Sync Theme from DB
          if (dbData.theme) {
            const currentLsTheme = localStorage.getItem("theme");
            // Only update if different to avoid flicker, but DB is source of truth
            if (dbData.theme !== currentLsTheme) {
              localStorage.setItem("theme", dbData.theme);
              applyTheme(dbData.theme);
            }
          } else {
            // If no theme in DB, set default 'light'
            localStorage.setItem("theme", "light");
            applyTheme("light");
          }
        }
      });

      // 3. Fetch Unread Notifications Summary (Login Toast)
      getUnreadNotifications(userId).then((result) => {
        if (result.success && result.data.length > 0) {
          const count = result.data.length;
          toast.info(
            `You have ${count} unread notification${count > 1 ? "s" : ""}`,
            {
              onClick: () => handleSwitchTab("notifications"),
            }
          );
        }
      });
    }

    // Cleanup: Remove theme classes when unmounting (leaving dashboard)
    return () => {
      document.body.classList.remove(
        "theme-ocean",
        "theme-sunset",
        "theme-forest",
        "theme-white"
      );
      document.documentElement.classList.remove("dark");
    };
  }, [userId]);

  const handleProfileUpdate = () => {
    // Refresh Avatar and User Info
    const extras = JSON.parse(
      localStorage.getItem(`user_extras_${userId}`) || "{}"
    );
    if (extras.avatarUrl) setAvatarUrl(extras.avatarUrl);
    if (extras.fullName) setUserName(extras.fullName);

    // Refresh Theme
    const savedTheme = localStorage.getItem("theme");
    applyTheme(savedTheme);

    // Close Modal
    setShowProfileModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans dark:bg-slate-900 transition-colors duration-300">
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

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-slate-400 hover:text-white hover:bg-red-600/10 hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm gap-3 group"
          >
            <MdLogout className="w-5 h-5 group-hover:text-red-500 transition-colors" />
            <span>Logout</span>
          </button>

          <div className="flex items-center gap-3 px-2 pt-2 border-t border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
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
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-800 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-24 flex items-center justify-between px-8 z-10 sticky top-0 transition-colors duration-300 relative">
          <div className="flex items-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors tracking-tight">
              {activeItem?.label}
            </h2>
          </div>

          {/* Centered Location and Quotes Section */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-1/3">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-2 ring-green-100 dark:ring-green-900"></span>
              {userLocation || "IMS Headquarters"}
            </div>

            <div className="flex items-center gap-2 text-lg font-medium text-gray-800 dark:text-white italic max-w-full text-center animate-fadeIn key={quote}">
              <MdFormatQuote className="text-blue-500 w-6 h-6 shrink-0 transform rotate-180 opacity-50" />
              <span className="truncate">{quote}</span>
              <MdFormatQuote className="text-blue-500 w-6 h-6 shrink-0 opacity-50" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <RoleSwitcher currentRole={role} />

            <NotificationDropdown
              userId={userId}
              onSwitchTab={handleSwitchTab}
            />

            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-2"></div>

            {/* Profile Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-all group max-w-sm"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition-all shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <MdPerson className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="text-left hidden sm:block">
                <div className="text-base font-bold text-gray-800 dark:text-white leading-tight truncate max-w-[180px]">
                  {userName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                  {userEmail}
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children ? (
              children
            ) : (
              <ActiveComponent
                highlightedRequestId={requestsHighlightId}
                onNavigate={handleSwitchTab}
              />
            )}
          </div>
        </main>
      </div>
      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          userId={userId}
          onProfileUpdate={handleProfileUpdate}
          onOpenBiodata={() => {
            setShowProfileModal(false);
            setShowBiodataModal(true);
          }}
        />
      )}
      {/* Biodata Modal */}
      {showBiodataModal && (
        <BiodataModal
          onClose={() => setShowBiodataModal(false)}
          userId={userId}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
