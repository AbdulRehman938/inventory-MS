import React from "react";
import { MdDashboard, MdPeople, MdSecurity } from "react-icons/md";
import DashboardLayout from "../../layouts/DashboardLayout";
import AdminOverview from "../../components/admin/AdminOverview";
import UserManagement from "../../components/admin/UserManagement";
import OTPViewer from "../../components/admin/OTPViewer";
import BiodataRequests from "../../components/admin/BiodataRequests";
import Notifications from "../Notifications";
import { MdNotifications } from "react-icons/md";

const AdminDashboard = () => {
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
      id: "otps",
      label: "OTP Verification",
      icon: <MdSecurity className="w-5 h-5" />,
      component: OTPViewer,
    },
    {
      id: "biodata",
      label: "Biodata Requests",
      icon: <MdPeople className="w-5 h-5" />,
      component: BiodataRequests,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <MdNotifications className="w-5 h-5" />,
      component: (props) => <Notifications title="Notifications" {...props} />,
    },
  ];

  return <DashboardLayout role="admin" sidebarItems={sidebarItems} />;
};

export default AdminDashboard;
