import React from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSwitcher from '../../components/RoleSwitcher';

const ControllerDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Controller Dashboard</h1>
            <div className="flex items-center gap-3">
              <RoleSwitcher currentRole="controller" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Controller</h2>
          <p className="text-gray-600">Monitor and manage inventory operations</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Controller Panel</h3>
          <p className="text-gray-600">Inventory management features coming soon...</p>
        </div>
      </main>
    </div>
  );
};

export default ControllerDashboard;
