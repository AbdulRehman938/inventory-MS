import React, { useState, useEffect } from "react";
import {
  MdDashboard,
  MdPeople,
  MdNotifications,
  MdInventory,
  MdCategory,
} from "react-icons/md";
import DashboardLayout from "../../layouts/DashboardLayout";
import AdminOverview from "../../components/admin/AdminOverview";
import UserManagement from "../../components/admin/UserManagement";
import BiodataRequests from "../../components/admin/BiodataRequests";
import StockManagement from "../../components/admin/StockManagement";
import CustomerTypesManagement from "../../components/admin/CustomerTypesManagement";
import Notifications from "../Notifications";
import DashboardLoader from "../../components/DashboardLoader";

const AdminDashboard = () => {
  // Check if loader has already been shown in this session
  const [isLoading, setIsLoading] = useState(() => {
    const hasShownLoader = sessionStorage.getItem("adminDashboardLoaded");
    return !hasShownLoader; // Show loader only if not shown before
  });

  useEffect(() => {
    // Mark loader as shown for this session
    if (isLoading) {
      sessionStorage.setItem("adminDashboardLoaded", "true");
    }
  }, [isLoading]);

  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <MdDashboard className="w-5 h-5" />,
      component: AdminOverview,
    },
    {
      id: "users",
      label: "User Management",
      icon: <MdPeople className="w-5 h-5" />,
      component: UserManagement,
    },
    {
      id: "biodata",
      label: "Biodata Requests",
      icon: <MdPeople className="w-5 h-5" />,
      component: BiodataRequests,
    },
    {
      id: "stock",
      label: "Stock Management",
      icon: <MdInventory className="w-5 h-5" />,
      component: StockManagement,
    },
    {
      id: "customer-types",
      label: "Customer Types",
      icon: <MdCategory className="w-5 h-5" />,
      component: CustomerTypesManagement,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <MdNotifications className="w-5 h-5" />,
      component: (props) => <Notifications title="Notifications" {...props} />,
    },
  ];

  if (isLoading) {
    return <DashboardLoader onComplete={() => setIsLoading(false)} />;
  }

  return <DashboardLayout role="admin" sidebarItems={sidebarItems} />;
};

export default AdminDashboard;
