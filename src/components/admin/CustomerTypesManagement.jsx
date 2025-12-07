import React, { useState, useEffect } from "react";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdSave,
  MdCategory,
} from "react-icons/md";
import {
  getCustomerTypes,
  createCustomerType,
  updateCustomerType,
  deleteCustomerType,
} from "../../services/customerService";
import { toast } from "react-toastify";

const CustomerTypesManagement = () => {
  const [customerTypes, setCustomerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    type_name: "",
    discount_percentage: 0,
    is_vip: false,
    description: "",
  });

  useEffect(() => {
    fetchCustomerTypes();
  }, []);

  const fetchCustomerTypes = async () => {
    setLoading(true);
    const result = await getCustomerTypes();
    if (result.success) {
      setCustomerTypes(result.data);
    } else {
      toast.error("Failed to fetch customer types");
    }
    setLoading(false);
  };

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        type_name: type.type_name,
        discount_percentage: type.discount_percentage,
        is_vip: type.is_vip,
        description: type.description || "",
      });
    } else {
      setEditingType(null);
      setFormData({
        type_name: "",
        discount_percentage: 0,
        is_vip: false,
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({
      type_name: "",
      discount_percentage: 0,
      is_vip: false,
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type_name.trim()) {
      toast.error("Please enter a type name");
      return;
    }

    const result = editingType
      ? await updateCustomerType(editingType.id, formData)
      : await createCustomerType(formData);

    if (result.success) {
      toast.success(
        `Customer type ${editingType ? "updated" : "created"} successfully!`
      );
      handleCloseModal();
      fetchCustomerTypes();
    } else {
      toast.error(result.message || "Operation failed");
    }
  };

  const handleDelete = async (id, typeName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${typeName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const result = await deleteCustomerType(id);
    if (result.success) {
      toast.success("Customer type deleted successfully!");
      fetchCustomerTypes();
    } else {
      toast.error(result.message || "Failed to delete customer type");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customer Types Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer categories and discount settings
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          Add Customer Type
        </button>
      </div>

      {/* Customer Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customerTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdCategory className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {type.type_name}
                </h3>
              </div>
              {type.is_vip && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full font-medium">
                  VIP
                </span>
              )}
            </div>

            {type.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {type.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Discount:
              </span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {type.discount_percentage}%
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleOpenModal(type)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
              >
                <MdEdit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(type.id, type.type_name)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
              >
                <MdDelete className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full animate-scaleIn">
            <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingType ? "Edit" : "Add"} Customer Type
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type Name *
                </label>
                <input
                  type="text"
                  value={formData.type_name}
                  onChange={(e) =>
                    setFormData({ ...formData, type_name: e.target.value })
                  }
                  placeholder="e.g., VIP Customer"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Percentage (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_vip}
                    onChange={(e) =>
                      setFormData({ ...formData, is_vip: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mark as VIP Customer Type
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this customer type"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <MdSave className="w-5 h-5" />
                  {editingType ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTypesManagement;
