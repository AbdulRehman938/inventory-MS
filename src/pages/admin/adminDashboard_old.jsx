import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllUsers, updateUserRole, deleteUser, toggleUserStatus, createUserByAdmin, updateUserData, getAllOTPs } from '../../services/userService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [otps, setOtps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showOTPViewer, setShowOTPViewer] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  
  // Add user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    roles: ['controller']
  });

  useEffect(() => {
    if (showUserManagement) {
      fetchUsers();
    }
  }, [showUserManagement]);

  const fetchUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.data);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleRoleChange = (userId, role, isChecked) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        let newRoles = [...user.role];
        if (isChecked) {
          if (!newRoles.includes(role)) {
            newRoles.push(role);
          }
        } else {
          newRoles = newRoles.filter(r => r !== role);
        }
        return { ...user, role: newRoles };
      }
      return user;
    }));
  };

  const handleSaveRole = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user || user.role.length === 0) {
      toast.error('User must have at least one role');
      return;
    }

    const result = await updateUserRole(userId, user.role);
    if (result.success) {
      toast.success('User role updated successfully');
      setEditingUser(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const result = await deleteUser(userId);
    if (result.success) {
      toast.success('User deleted successfully');
      fetchUsers();
    } else {
      toast.error(result.message);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const result = await toggleUserStatus(userId, !currentStatus);
    if (result.success) {
      toast.success(result.message);
      fetchUsers();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {!showUserManagement ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Administrator</h2>
              <p className="text-gray-600">Manage your inventory system from here</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Admin Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => setShowUserManagement(true)}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                >
                  Manage Users
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <button
                onClick={() => setShowUserManagement(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user.id ? (
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={user.role.includes('admin')}
                                  onChange={(e) => handleRoleChange(user.id, 'admin', e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-sm">Admin</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={user.role.includes('controller')}
                                  onChange={(e) => handleRoleChange(user.id, 'controller', e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-sm">Controller</span>
                              </label>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {user.role.map((role) => (
                                <span
                                  key={role}
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    role === 'admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingUser === user.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveRole(user.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  fetchUsers();
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingUser(user.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
