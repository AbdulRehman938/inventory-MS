import React from "react";

const ControllerOverview = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, Controller
        </h2>
        <p className="text-gray-600">
          Monitor and manage inventory operations from this dashboard.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Controller Panel
        </h3>
        <p className="text-gray-600">
          Inventory management features coming soon...
        </p>
      </div>
    </div>
  );
};

export default ControllerOverview;
