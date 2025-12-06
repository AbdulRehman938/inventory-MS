import React from "react";
import { MdDashboard, MdInventory } from "react-icons/md";
import DashboardLayout from "../../layouts/DashboardLayout";
import ControllerOverview from "../../components/controller/ControllerOverview";

const ControllerDashboard = () => {
  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <MdDashboard className="w-5 h-5" />,
      component: ControllerOverview,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: <MdInventory className="w-5 h-5" />,
      component: () => (
        <div className="p-8 text-center text-gray-500">
          Inventory Module Coming Soon
        </div>
      ),
    },
  ];

  return <DashboardLayout role="controller" sidebarItems={sidebarItems} />;
};

export default ControllerDashboard;
