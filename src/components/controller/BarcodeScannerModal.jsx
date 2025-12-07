import React, { useState, useRef, useEffect } from "react";
import {
  MdClose,
  MdCamera,
  MdDelete,
  MdAdd,
  MdRemove,
  MdCheckCircle,
  MdQrCodeScanner,
} from "react-icons/md";
import { findProductByCodeSmart } from "../../services/salesService";
import { toast } from "react-toastify";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const BarcodeScannerModal = ({ onClose, onComplete, customerData }) => {
  const [scannedItems, setScannedItems] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [lastScanValue, setLastScanValue] = useState("");
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScannedRef = useRef({ code: null, time: 0 });

  // Focus on input when modal opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initialize and cleanup Html5Qrcode
  useEffect(() => {
    // Cleanup function to stop scanner on unmount or when camera toggles off
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            console.log("🛑 Scanner and camera stopped");
            html5QrCodeRef.current.clear();
          })
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      // Logic to stop handled by cleanup or check below
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            setScannerReady(false);
            html5QrCodeRef.current.clear();
          })
          .catch((err) => console.error(err));
      }
      return;
    }

    const startScanner = async () => {
      try {
        console.log("🎥 Starting QR/Barcode scanner...");

        // Element ID for the scanner
        const elementId = "qr-reader";

        // Destroy instance if exists to be safe
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.clear();
          } catch (e) {}
        }

        const html5QrCode = new Html5Qrcode(elementId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Support multiple formats including QR and Barcodes
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText, decodedResult) => {
            handleScanSuccess(decodedText, decodedResult);
          },
          (errorMessage) => {
            // parse error, ignore it.
          }
        );

        setScannerReady(true);
        toast.success("Scanner camera ready!");
      } catch (err) {
        console.error("Error starting scanner:", err);
        toast.error(
          "Failed to start camera. Please ensure permissions are granted."
        );
        setCameraActive(false);
      }
    };

    // Small timeout to ensure DOM is ready
    setTimeout(startScanner, 100);
  }, [cameraActive]);

  const handleScanSuccess = (decodedText, decodedResult) => {
    // Debounce
    const now = Date.now();
    if (
      lastScannedRef.current.code === decodedText &&
      now - lastScannedRef.current.time < 2000
    ) {
      return;
    }

    lastScannedRef.current = { code: decodedText, time: now };
    setLastScanValue(decodedText);
    console.log(`🎉 Scan detected: ${decodedText}`, decodedResult);

    // Visual feedback
    const element = document.getElementById("qr-reader");
    if (element) {
      element.style.border = "4px solid #10b981";
      setTimeout(() => (element.style.border = "none"), 300);
    }

    // Process the code
    handleCodeDetected(decodedText);
  };

  const handleCodeDetected = async (code) => {
    try {
      const raw = (code || "").trim();
      if (!raw) return;

      console.log("📦 Fetching product for code:", raw);

      const productResult = await findProductByCodeSmart(raw);

      if (productResult.success && productResult.data) {
        const product = productResult.data;

        // 1. Stock Check
        if (product.quantity <= 0) {
          toast.error(`❌ Out of Stock: ${product.product_name}`);
          console.warn("Out of stock attempt:", product.product_name);
          return;
        }

        setScannedItems((prevItems) => {
          // 2. Duplicate Check in Cart
          const existingIndex = prevItems.findIndex(
            (item) => item.barcode === product.barcode
          );

          if (existingIndex >= 0) {
            toast.error(
              `⚠️ Item already in buying queue: ${product.product_name}`,
              {
                toastId: `dup-${product.barcode}`,
              }
            );
            return prevItems;
          } else {
            toast.success(`✅ Added ${product.product_name}`);
            return [
              ...prevItems,
              {
                id: product.id,
                product_id: product.product_id,
                product_name: product.product_name,
                sku: product.sku,
                barcode: product.barcode,
                category: product.category,
                quantity: 1,
                unit_price: product.unit_price,
                total_price: product.unit_price,
                image_url: product.image_url,
              },
            ];
          }
        });

        setBarcodeInput("");
      } else {
        console.warn("⚠️ Product not found for code:", raw);
        toast.error(`❌ Product not found: ${raw}`, {
          toastId: `not-found-${raw}`,
        });
      }
    } catch (error) {
      console.error("❌ Error handling code:", error);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setScanning(true);
    await handleCodeDetected(barcodeInput.trim());
    setBarcodeInput("");
    setScanning(false);
    inputRef.current?.focus();
  };

  const updateQuantity = (index, delta) => {
    const updated = [...scannedItems];
    updated[index].quantity = Math.max(1, updated[index].quantity + delta);
    updated[index].total_price =
      updated[index].quantity * updated[index].unit_price;
    setScannedItems(updated);
  };

  const removeItem = (index) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (scannedItems.length === 0) {
      toast.error("Please scan at least one item");
      return;
    }
    setCameraActive(false);
    onComplete(scannedItems);
  };

  const handleClose = () => {
    setCameraActive(false);
    onClose();
  };

  const subtotal = scannedItems.reduce(
    (sum, item) => sum + item.total_price,
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col animate-scaleIn">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MdQrCodeScanner /> Scan Items (QR / Barcode)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Customer: {customerData.customerName} •{" "}
              {customerData.customerType.type_name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Scanner */}
          <div className="md:w-1/2 p-6 border-r border-gray-200 dark:border-slate-700 overflow-y-auto">
            <div className="space-y-4">
              {/* Manual Input */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ⌨️ Enter Code Manually
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan QR or type code..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                    disabled={scanning}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={scanning || !barcodeInput.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                  >
                    {scanning ? "⏳" : "Add"}
                  </button>
                </div>
              </form>

              {/* Camera Toggle */}
              <div>
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    cameraActive
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  <MdCamera className="w-5 h-5" />
                  {cameraActive ? "Stop Camera" : "Start Camera"}
                </button>
              </div>

              {/* Camera Scanner Viewport */}
              {cameraActive && (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl min-h-[300px]">
                    <div id="qr-reader" className="w-full h-full"></div>

                    {!scannerReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
                        <p className="text-white">Initializing Camera...</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-xs text-gray-500">
                    Point camera at a QR Code or Barcode
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!cameraActive && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                      💡 Tips
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc ml-4 space-y-1">
                      <li>Hold camera steady</li>
                      <li>Ensure good lighting</li>
                      <li>
                        Works with <strong>QR Codes</strong> and{" "}
                        <strong>Barcodes</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Scanned Items */}
          <div className="md:w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Scanned Items ({scannedItems.length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-2">
              {scannedItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MdQrCodeScanner className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No items scanned yet</p>
                </div>
              ) : (
                scannedItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-700 rounded-lg p-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-slate-600"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {item.barcode}
                      </div>
                    </div>

                    <div className="font-medium text-gray-900 dark:text-gray-200">
                      ${item.unit_price.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm text-gray-600 dark:text-gray-300"
                      >
                        <MdRemove className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded shadow-sm text-gray-600 dark:text-gray-300"
                      >
                        <MdAdd className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white mb-4">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleComplete}
                disabled={scannedItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <MdCheckCircle className="w-6 h-6" />
                Complete Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
