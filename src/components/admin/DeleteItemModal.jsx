import React from "react";
import { MdClose, MdWarning, MdDelete } from "react-icons/md";

const DeleteItemModal = ({ item, onClose, onConfirm }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full animate-scaleIn">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <MdWarning className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
              Delete Stock Item
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <MdWarning className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                  Are you sure you want to delete this item?
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone. The following item will be
                  permanently removed:
                </p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {item.product_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.brand} • {item.category}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  SKU: {item.sku}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quantity
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Unit Price
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${item.unit_price?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <MdDelete className="w-5 h-5" />
              Delete Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteItemModal;
