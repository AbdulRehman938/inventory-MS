import React, { useState, useEffect } from "react";
import { MdDashboard, MdNotifications } from "react-icons/md";
import DashboardLayout from "../../layouts/DashboardLayout";
import ControllerOverview from "../../components/controller/ControllerOverview";
import Notifications from "../Notifications";
import DashboardLoader from "../../components/DashboardLoader";

const ControllerDashboard = () => {
  // Check if loader has already been shown in this session
  const [isLoading, setIsLoading] = useState(() => {
    const hasShownLoader = sessionStorage.getItem("controllerDashboardLoaded");
    return !hasShownLoader; // Show loader only if not shown before
  });

  useEffect(() => {
    // Mark loader as shown for this session
    if (isLoading) {
      sessionStorage.setItem("controllerDashboardLoaded", "true");
    }
  }, [isLoading]);

  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <MdDashboard className="w-5 h-5" />,
      component: ControllerOverview,
    },
    {
      id: "notifications",
      label: "Alerts",
      icon: <MdNotifications className="w-5 h-5" />,
      component: (props) => <Notifications title="Alerts" {...props} />,
    },
  ];

  if (isLoading) {
    return <DashboardLoader onComplete={() => setIsLoading(false)} />;
  }

  return <DashboardLayout role="controller" sidebarItems={sidebarItems} />;
};

export default ControllerDashboard;
