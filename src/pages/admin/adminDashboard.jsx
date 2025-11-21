import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllUsers, updateUserRole, deleteUser, toggleUserStatus, createUserByAdmin, updateUserData, getAllOTPs } from '../../services/userService';
import RoleSwitcher from '../../components/RoleSwitcher';

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

  useEffect(() => {
    if (showOTPViewer) {
      fetchOTPs();
      // Auto-refresh OTPs every 10 seconds
      const interval = setInterval(fetchOTPs, 10000);
      return () => clearInterval(interval);
    }
  }, [showOTPViewer]);

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

  const fetchOTPs = async () => {
    const result = await getAllOTPs();
    if (result.success) {
      setOtps(result.data);
    } else {
      toast.error(result.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await createUserByAdmin(
      newUser.email,
      newUser.password,
      newUser.fullName,
      newUser.roles
    );

    if (result.success) {
      toast.success('User created successfully');
      setShowAddUserModal(false);
      setNewUser({ email: '', password: '', fullName: '', roles: ['controller'] });
      fetchUsers();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
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

  const handleOpenEditModal = (user) => {
    setEditModalData({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      password: '',
      roles: user.role,
      isActive: user.is_active
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updates = {
      email: editModalData.email,
      fullName: editModalData.fullName,
      roles: editModalData.roles,
      isActive: editModalData.isActive
    };

    if (editModalData.password) {
      updates.password = editModalData.password;
    }

    const result = await updateUserData(editModalData.id, updates);

    if (result.success) {
      toast.success('User updated successfully');
      setEditModalData(null);
      fetchUsers();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

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

  const handleEditModalRoleChange = (role, isChecked) => {
    let newRoles = [...editModalData.roles];
    if (isChecked) {
      if (!newRoles.includes(role)) {
        newRoles.push(role);
      }
    } else {
      newRoles = newRoles.filter(r => r !== role);
    }
    setEditModalData({ ...editModalData, roles: newRoles });
  };

  const handleNewUserRoleChange = (role, isChecked) => {
    let newRoles = [...newUser.roles];
    if (isChecked) {
      if (!newRoles.includes(role)) {
        newRoles.push(role);
      }
    } else {
      newRoles = newRoles.filter(r => r !== role);
    }
    setNewUser({ ...newUser, roles: newRoles });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <RoleSwitcher currentRole="admin" />
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
        {!showUserManagement && !showOTPViewer ? (
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
                <button 
                  onClick={() => setShowOTPViewer(true)}
                  className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium"
                >
                  View OTPs
                </button>
              </div>
            </div>
          </>
        ) : showOTPViewer ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">OTP Verification Codes</h2>
                <p className="text-sm text-gray-600">Auto-refreshes every 10 seconds</p>
              </div>
              <button
                onClick={() => {
                  setShowOTPViewer(false);
                  setOtps([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OTP Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {otps.map((otp) => (
                    <tr key={otp.id} className={otp.is_verified ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{otp.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600 tracking-wider">{otp.otp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          otp.purpose === 'signup' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {otp.purpose}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          otp.is_verified ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {otp.is_verified ? 'Verified' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(otp.expires_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(otp.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {otps.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  No OTP codes found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add New User
                </button>
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditModal(user)}
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newUser.roles.includes('admin')}
                      onChange={(e) => handleNewUserRoleChange('admin', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Admin</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newUser.roles.includes('controller')}
                      onChange={(e) => handleNewUserRoleChange('controller', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Controller</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={loading || newUser.roles.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUser({ email: '', password: '', fullName: '', roles: ['controller'] });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editModalData.fullName}
                  onChange={(e) => setEditModalData({ ...editModalData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editModalData.email}
                  onChange={(e) => setEditModalData({ ...editModalData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editModalData.password}
                  onChange={(e) => setEditModalData({ ...editModalData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength="6"
                  placeholder="Enter new password or leave blank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editModalData.roles.includes('admin')}
                      onChange={(e) => handleEditModalRoleChange('admin', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Admin</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editModalData.roles.includes('controller')}
                      onChange={(e) => handleEditModalRoleChange('controller', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Controller</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editModalData.isActive}
                    onChange={(e) => setEditModalData({ ...editModalData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Account Active</span>
                </label>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={loading || editModalData.roles.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
