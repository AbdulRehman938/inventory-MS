import React, { useState } from "react";
import { MdClose, MdPrint, MdDownload, MdCheckCircle } from "react-icons/md";
import { createSalesTransaction } from "../../services/salesService";
import { createOrGetCustomer } from "../../services/customerService";
import { toast } from "react-toastify";
import { generateBillPDF } from "../../utils/billGenerator";

const CheckoutSummaryModal = ({ onClose, customerData, scannedItems }) => {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [transactionData, setTransactionData] = useState(null);

  const subtotal = scannedItems.reduce(
    (sum, item) => sum + item.total_price,
    0
  );
  const discountPercentage = customerData.customerType.discount_percentage || 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const totalAmount = subtotal - discountAmount;

  const handleCheckout = async () => {
    setProcessing(true);

    try {
      // Create or get customer
      const customerResult = await createOrGetCustomer({
        customer_name: customerData.customerName,
        customer_type_id: customerData.customerType.id,
        customer_type_name: customerData.customerType.type_name,
        is_vip: customerData.customerType.is_vip,
      });

      if (!customerResult.success) {
        throw new Error("Failed to create customer record");
      }

      // Create sales transaction
      const transactionResult = await createSalesTransaction({
        customer_id: customerResult.data.id,
        customer_name: customerData.customerName,
        customer_type: customerData.customerType.type_name,
        payment_type: customerData.paymentType,
        is_vip: customerData.customerType.is_vip,
        discount_percentage: discountPercentage,
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        items: scannedItems,
      });

      if (!transactionResult.success) {
        throw new Error("Failed to create transaction");
      }

      setTransactionData(transactionResult.data);
      setCompleted(true);
      toast.success("Transaction completed successfully!");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to complete checkout");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadBill = async () => {
    if (!transactionData) return;

    await generateBillPDF({
      transaction: transactionData,
      customer: customerData,
      items: scannedItems,
      subtotal,
      discountAmount,
      totalAmount,
    });
  };

  const handlePrintBill = async () => {
    if (!transactionData) return;

    // Generate PDF and open print dialog
    const pdfBlob = await generateBillPDF({
      transaction: transactionData,
      customer: customerData,
      items: scannedItems,
      subtotal,
      discountAmount,
      totalAmount,
      returnBlob: true,
    });

    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url);
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {completed ? "Transaction Complete" : "Checkout Summary"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Name:</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {customerData.customerName}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Type:</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {customerData.customerType.type_name}
                  {customerData.customerType.is_vip && " (VIP)"}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Payment:
                </span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100 capitalize">
                  {customerData.paymentType}
                </span>
              </div>
              {discountPercentage > 0 && (
                <div>
                  <span className="text-blue-700 dark:text-blue-300">
                    Discount:
                  </span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                    {discountPercentage}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">
              Items ({scannedItems.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scannedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${item.unit_price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    ${item.total_price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({discountPercentage}%):</span>
                <span className="font-medium">
                  -${discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-slate-700">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Transaction Number */}
          {completed && transactionData && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <MdCheckCircle className="w-6 h-6" />
                <div>
                  <div className="font-bold">Transaction Successful!</div>
                  <div className="text-sm">
                    Transaction #: {transactionData.transaction_number}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
          {!completed ? (
            <>
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <MdCheckCircle className="w-5 h-5" />
                    Complete Checkout
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePrintBill}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <MdPrint className="w-5 h-5" />
                Print Bill
              </button>
              <button
                onClick={handleDownloadBill}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <MdDownload className="w-5 h-5" />
                Download Bill
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummaryModal;
