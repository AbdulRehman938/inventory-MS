import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdClose,
  MdCameraAlt,
  MdAdd,
  MdDelete,
  MdLock,
  MdPerson,
  MdPalette,
  MdNotifications,
} from "react-icons/md";
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  requestRoleAssignment,
} from "../services/userService";
import { motion } from "framer-motion";

// Mini-Dashboard Skeleton for Theme Preview
const ThemePreviewSkeleton = ({ theme }) => {
  // Define colors based on theme
  const colors = {
    light: {
      sidebar: "#1e293b",
      header: "#ffffff",
      bg: "#f9fafb",
      accent: "#3b82f6",
      text: "#1e293b",
    },
    white: {
      sidebar: "#ffffff",
      header: "#ffffff",
      bg: "#ffffff",
      accent: "#3b82f6",
      border: "#e5e7eb",
      text: "#0f172a",
    },
    dark: {
      sidebar: "#000000",
      header: "#121212",
      bg: "#121212",
      accent: "#3b82f6",
      text: "#e2e8f0",
    },
    ocean: {
      sidebar: "#0284c7",
      header: "#e0f2fe",
      bg: "#f0f9ff",
      accent: "#0ea5e9",
      text: "#0c4a6e",
    },
    sunset: {
      sidebar: "#ea580c",
      header: "#ffedd5",
      bg: "#fff7ed",
      accent: "#f97316",
      text: "#7c2d12",
    },
    forest: {
      sidebar: "#059669",
      header: "#d1fae5",
      bg: "#ecfdf5",
      accent: "#10b981",
      text: "#064e3b",
    },
  }[theme] || {
    sidebar: "#1e293b",
    header: "#fff",
    bg: "#f3f4f6",
    accent: "#3b82f6",
  };

  const isWhite = theme === "white";

  return (
    <div
      className="w-full h-24 rounded-lg overflow-hidden flex shadow-sm border border-gray-100 relative select-none"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Mini Sidebar */}
      <div
        style={{
          backgroundColor: colors.sidebar,
          width: "28%",
          borderRight: isWhite ? `1px solid ${colors.border}` : "none",
        }}
        className="flex flex-col gap-1.5 p-1.5 pt-2"
      >
        <div
          style={{
            backgroundColor: isWhite ? "#f1f5f9" : "rgba(255,255,255,0.2)",
          }}
          className="h-2 w-full rounded-full mb-1"
        ></div>
        <div
          style={{
            backgroundColor: isWhite ? "#eff6ff" : "rgba(255,255,255,0.1)",
          }}
          className="h-1.5 w-3/4 rounded-full"
        ></div>
        <div
          style={{
            backgroundColor: isWhite ? "#f1f5f9" : "rgba(255,255,255,0.1)",
          }}
          className="h-1.5 w-4/5 rounded-full"
        ></div>
        <div
          style={{
            backgroundColor: isWhite ? "#f1f5f9" : "rgba(255,255,255,0.1)",
          }}
          className="h-1.5 w-2/3 rounded-full"
        ></div>
      </div>
      {/* Mini Main */}
      <div className="flex-1 flex flex-col">
        {/* Mini Header */}
        <div
          style={{
            backgroundColor: colors.header,
            borderBottom: isWhite ? `1px solid ${colors.border}` : "none",
          }}
          className="h-6 w-full mb-1 flex items-center justify-end px-2 gap-1.5 shadow-sm z-10"
        >
          <div
            style={{ backgroundColor: colors.accent }}
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
          ></div>
        </div>
        {/* Mini Content */}
        <div className="p-1.5 gap-1.5 flex flex-col h-full">
          <div
            style={{
              backgroundColor: isWhite ? "#f8fafc" : "rgba(0,0,0,0.03)",
            }}
            className="h-full w-full rounded border border-black/5 p-1 flex gap-1"
          >
            <div
              style={{ backgroundColor: colors.accent, opacity: 0.1 }}
              className="h-full w-1/3 rounded"
            ></div>
            <div
              style={{
                backgroundColor: isWhite ? "#ffffff" : "rgba(255,255,255,0.5)",
              }}
              className="h-full flex-1 rounded"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ onClose, userId, onProfileUpdate, onOpenBiodata }) => {
  // Initial load from localStorage for speed
  const savedExtras = JSON.parse(
    localStorage.getItem(`user_extras_${userId}`) || "{}"
  );
  const savedTheme = localStorage.getItem("theme") || "light";

  // Use state for roles to trigger re-renders
  const [userRoles, setUserRoles] = useState(
    JSON.parse(localStorage.getItem("userRoles") || "[]")
  );
  const [hasThemeAccess, setHasThemeAccess] = useState(false);

  // Check permissions based on CURRENT state
  const isController =
    userRoles.includes("controller") && !userRoles.includes("admin");
  const hasThemePermission =
    userRoles.includes("theme_pro") || userRoles.includes("admin"); // valid for legacy or admin

  const canUseCustomThemes =
    !isController || hasThemePermission || hasThemeAccess;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    fullName: savedExtras.fullName || "",
    email: "",
    avatarUrl: savedExtras.avatarUrl || "",
    jobTitle: savedExtras.jobTitle || "",
    phone: savedExtras.phone || "",
    location: "", // Now prioritized from DB, see loadProfile
    bio: savedExtras.bio || "",
    reminders: savedExtras.reminders || [],
    theme: savedTheme,
  });

  const [newReminder, setNewReminder] = useState({ text: "", dateTime: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await getCurrentUserProfile(userId);

    if (result.success) {
      const dbData = result.data;

      // Update localStorage with fresh roles for permissions
      if (dbData.role) {
        localStorage.setItem("userRoles", JSON.stringify(dbData.role));
        setUserRoles(dbData.role);
      }

      // Update Theme Access from DB (handle both true and false)
      setHasThemeAccess(!!dbData.theme_access);

      setProfile((prev) => ({
        ...prev,
        fullName: dbData.full_name || prev.fullName,
        email: dbData.email || "",
        // Prioritize DB location if it exists, else empty
        location: dbData.location || "",
        // Sync database theme
        theme: dbData.theme || prev.theme,
        // Sync database avatar
        avatarUrl: dbData.avatar_url || prev.avatarUrl,
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    // 1. Try updating everything (optimistic)
    let nameUpdate = await updateCurrentUserProfile(userId, {
      full_name: profile.fullName,
      theme: profile.theme, // Save theme to DB
      avatar_url: profile.avatarUrl, // Save avatar to DB
    });

    // 2. Fallback: If DB fails due to missing 'theme' column, retry without it
    if (
      !nameUpdate.success &&
      (nameUpdate.message.includes("theme") ||
        nameUpdate.message.includes("schema cache"))
    ) {
      console.warn(
        "Theme column missing/desynced in DB, saving core details only."
      );
      nameUpdate = await updateCurrentUserProfile(userId, {
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
      });

      if (nameUpdate.success) {
        toast.warning(
          "Profile saved, but Theme synced locally only (Run DB Script)."
        );
      }
    }

    if (!nameUpdate.success) {
      toast.error(nameUpdate.message);
      setSaving(false);
      return;
    }

    const extras = {
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      jobTitle: profile.jobTitle,
      phone: profile.phone,
      // location: NO LONGER SAVED TO EXTRAS (ReadOnly)
      bio: profile.bio,
      reminders: profile.reminders,
    };
    localStorage.setItem(`user_extras_${userId}`, JSON.stringify(extras));
    localStorage.setItem("theme", profile.theme);

    toast.success("Profile saved successfully");
    setSaving(false);

    if (onProfileUpdate) {
      onProfileUpdate();
    } else {
      onClose();
    }
  };

  const addReminder = () => {
    if (newReminder.text && newReminder.dateTime) {
      setProfile((p) => ({ ...p, reminders: [...p.reminders, newReminder] }));
      setNewReminder({ text: "", dateTime: "" });
    }
  };
  const removeReminder = (i) => {
    setProfile((p) => ({
      ...p,
      reminders: p.reminders.filter((_, x) => x !== i),
    }));
  };

  // Image Upload Handler
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const themes = [
    { id: "light", label: "Default (Blue)", allowed: true },
    { id: "white", label: "Pure White", allowed: true },
    { id: "dark", label: "True Black", allowed: true },
    { id: "ocean", label: "Ocean Blue", allowed: canUseCustomThemes },
    { id: "sunset", label: "Sunset Orange", allowed: canUseCustomThemes },
    { id: "forest", label: "Forest Green", allowed: canUseCustomThemes },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <MdPerson className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-500">
                Customize your personal details and app appearance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-200">
          <form onSubmit={handleSave} className="p-8 space-y-12">
            {/* Section 1: User Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
                <MdPerson className="text-blue-500" /> Personal Information
              </h3>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full ring-4 ring-gray-50 shadow bg-gray-200 overflow-hidden relative group">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 bg-gray-50">
                        {profile.fullName?.[0]}
                      </div>
                    )}
                    <div
                      onClick={triggerFileInput}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    >
                      <MdCameraAlt className="w-8 h-8 text-white" />
                    </div>
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                      Image URL
                    </label>
                    <input
                      value={profile.avatarUrl}
                      onChange={(e) =>
                        setProfile({ ...profile, avatarUrl: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={profile.jobTitle}
                      onChange={(e) =>
                        setProfile({ ...profile, jobTitle: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      rows="2"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Appearance & Extras */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Theme Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
                  <MdPalette className="text-pink-500" /> Dashboard Theme
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          t.allowed && setProfile({ ...profile, theme: t.id })
                        }
                        disabled={!t.allowed}
                        className={`relative group text-left rounded-xl transition-all duration-300 ${
                          profile.theme === t.id
                            ? "ring-2 ring-blue-500 ring-offset-2 opacity-100 shadow-md transform scale-[1.01]"
                            : t.allowed
                            ? "hover:ring-2 hover:ring-gray-200 hover:opacity-100 opacity-90"
                            : "opacity-50 grayscale cursor-not-allowed"
                        }`}
                      >
                        <ThemePreviewSkeleton theme={t.id} />
                        <div className="mt-2 flex items-center justify-between px-1">
                          <span
                            className={`text-xs font-bold ${
                              profile.theme === t.id
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                          >
                            {t.label}
                          </span>
                          {profile.theme === t.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          )}
                          {!t.allowed && (
                            <MdLock className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {!canUseCustomThemes && (
                    <div className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                      <MdLock className="w-3 h-3" /> Custom themes require
                      Admin/Controller permissions.
                    </div>
                  )}
                </div>
              </div>

              {/* Post Location & Extras Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-8 h-fit">
                {/* Controller Post Location */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MdLock className="w-4 h-4" /> Post Location
                  </h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                      Assigned by Admin
                    </label>

                    {profile.location ? (
                      <div className="text-lg font-bold text-gray-800">
                        {profile.location}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-gray-500 italic">
                          Not Assigned
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              confirm(
                                "Request Admins to assign a location/role?"
                              )
                            ) {
                              await requestRoleAssignment(
                                userId,
                                profile.fullName || "User"
                              );
                              toast.success("Request sent to Admins");
                            }
                          }}
                          className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 w-fit"
                        >
                          <MdNotifications className="w-3 h-3" /> Request
                          Allocation
                        </button>
                      </div>
                    )}

                    <div
                      className="absolute top-2 right-2 text-gray-400 group-hover:text-gray-500 cursor-help"
                      title="This field can only be updated by an Administrator"
                    >
                      <MdLock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Please contact your administrator if this information is
                    incorrect.
                  </p>
                </div>

                {/* Personal Information Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBiodata) {
                        onOpenBiodata();
                      } else {
                        // Fallback in case prop is not passed (should not happen in DashboardLayout)
                        onClose();
                      }
                    }}
                    className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-100 flex items-center justify-center gap-2 transition-all group"
                  >
                    <MdPerson className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Edit Personal Information / Biodata
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">
                    Update detailed biodata, address, and experience.
                  </p>
                </div>

                {/* Reminders */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MdNotifications /> Reminders
                  </h3>
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                    {profile.reminders.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg group"
                      >
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-yellow-900 mb-0.5">
                            {r.text}
                          </p>
                          <p className="text-[10px] text-yellow-700 font-mono opacity-80">
                            {new Date(r.dateTime).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeReminder(i)}
                          className="text-yellow-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {profile.reminders.length === 0 && (
                      <p className="text-xs text-gray-400 italic">
                        No reminders set.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      value={newReminder.text}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, text: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none"
                      placeholder="Reminder..."
                    />
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={newReminder.dateTime}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            dateTime: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={addReminder}
                        className="w-9 h-9 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                      >
                        <MdAdd className="w-5 h-5 text-yellow-700" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 z-20">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all text-sm transform active:scale-95 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;
