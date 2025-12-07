import React, { useState, useEffect } from "react";
import { MdClose, MdPerson, MdPayment, MdCategory } from "react-icons/md";
import { getCustomerTypes } from "../../services/customerService";

const CustomerDetailsModal = ({ onClose, onNext }) => {
  const [customerName, setCustomerName] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [customerTypes, setCustomerTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerTypes();
  }, []);

  const fetchCustomerTypes = async () => {
    const result = await getCustomerTypes();
    if (result.success) {
      setCustomerTypes(result.data.filter((t) => t.type_name !== "Dummy"));
      // Set default to "Walk-in Customer"
      const walkIn = result.data.find(
        (t) => t.type_name === "Walk-in Customer"
      );
      if (walkIn) setSelectedType(walkIn);
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    if (!selectedType) {
      alert("Please select customer type");
      return;
    }

    onNext({
      customerName: customerName.trim(),
      paymentType,
      customerType: selectedType,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full animate-scaleIn">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Customer Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <MdPerson className="w-5 h-5" />
                Customer Name *
              </div>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <MdPayment className="w-5 h-5" />
                Payment Type
              </div>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["cash", "card", "upi"].map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentType(type)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all capitalize font-medium text-base ${
                    paymentType === type
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md"
                      : "border-gray-300 dark:border-slate-600 hover:border-blue-300 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <MdCategory className="w-5 h-5" />
                Customer Type
              </div>
            </label>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      selectedType?.id === type.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-slate-600 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {type.type_name}
                          {type.is_vip && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                        {type.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {type.description}
                          </div>
                        )}
                      </div>
                      {type.discount_percentage > 0 && (
                        <div className="text-green-600 dark:text-green-400 font-bold">
                          {type.discount_percentage}% OFF
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Type Info */}
          {selectedType && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Selected:</strong> {selectedType.type_name}
                {selectedType.discount_percentage > 0 && (
                  <span className="ml-2">
                    • <strong>{selectedType.discount_percentage}%</strong>{" "}
                    discount will be applied
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Next: Scan Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
