import React from "react";

const AdminOverview = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, Administrator
        </h2>
        <p className="text-gray-600">
          Here's what's happening in your inventory system today.
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-blue-800 font-semibold">Total Users</h3>
          <p className="text-3xl font-bold text-blue-900 mt-2">--</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 className="text-green-800 font-semibold">System Status</h3>
          <p className="text-3xl font-bold text-green-900 mt-2">Active</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <h3 className="text-purple-800 font-semibold">Pending Actions</h3>
          <p className="text-3xl font-bold text-purple-900 mt-2">0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
