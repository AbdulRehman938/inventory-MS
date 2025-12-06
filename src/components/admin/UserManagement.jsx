import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  createUserByAdmin,
  updateUserData,
} from "../../services/userService";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editModalData, setEditModalData] = useState(null);

  // Add user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    roles: ["controller"],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
      toast.success("User created successfully");
      setShowAddUserModal(false);
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        roles: ["controller"],
      });
      fetchUsers();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updates = {
      email: editModalData.email,
      fullName: editModalData.fullName,
      roles: editModalData.roles,
      isActive: editModalData.isActive,
    };

    if (editModalData.password) {
      updates.password = editModalData.password;
    }

    const result = await updateUserData(editModalData.id, updates);

    if (result.success) {
      toast.success("User updated successfully");
      setEditModalData(null);
      fetchUsers();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("User deleted successfully");
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
      newRoles = newRoles.filter((r) => r !== role);
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
      newRoles = newRoles.filter((r) => r !== role);
    }
    setNewUser({ ...newUser, roles: newRoles });
  };

  const handleOpenEditModal = (user) => {
    setEditModalData({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      password: "",
      roles: user.role,
      isActive: user.is_active,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-gray-800">User Management</h3>
          <p className="text-sm text-gray-500">Manage access and roles</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <MdAdd className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {user.role.map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                              role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleToggleStatus(user.id, user.is_active)
                        }
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.is_active
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Edit User"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Delete User"
                        >
                          <MdDelete className="w-5 h-5" />
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Add New User
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  minLength="6"
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Roles
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.roles.includes("admin")}
                      onChange={(e) =>
                        handleNewUserRoleChange("admin", e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Administrator</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUser.roles.includes("controller")}
                      onChange={(e) =>
                        handleNewUserRoleChange("controller", e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Controller</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || newUser.roles.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Same inputs as Add User, but pre-filled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editModalData.fullName}
                  onChange={(e) =>
                    setEditModalData({
                      ...editModalData,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  onChange={(e) =>
                    setEditModalData({
                      ...editModalData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editModalData.password}
                  onChange={(e) =>
                    setEditModalData({
                      ...editModalData,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank to keep current"
                  minLength="6"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editModalData.roles.includes("admin")}
                        onChange={(e) =>
                          handleEditModalRoleChange("admin", e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">
                        Administrator
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editModalData.roles.includes("controller")}
                        onChange={(e) =>
                          handleEditModalRoleChange(
                            "controller",
                            e.target.checked
                          )
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">Controller</span>
                    </label>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editModalData.isActive}
                      onChange={(e) =>
                        setEditModalData({
                          ...editModalData,
                          isActive: e.target.checked,
                        })
                      }
                      className="rounded text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Account Active
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || editModalData.roles.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
