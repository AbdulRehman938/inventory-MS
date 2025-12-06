import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdRefresh } from "react-icons/md";
import { getAllOTPs } from "../../services/userService";

const OTPViewer = () => {
  const [otps, setOtps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOTPs();
    // Auto-refresh OTPs every 10 seconds
    const interval = setInterval(fetchOTPs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOTPs = async () => {
    // setLoading(true); // Don't show loading on every refresh
    const result = await getAllOTPs();
    if (result.success) {
      setOtps(result.data);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            OTP Verification Codes
          </h3>
          <p className="text-sm text-gray-500">
            Live monitoring (Auto-refreshes every 10s)
          </p>
        </div>
        <button
          onClick={() => fetchOTPs()}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Refresh Now"
        >
          <MdRefresh className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {otps.map((otp) => (
              <tr key={otp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {otp.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-lg font-bold text-blue-600 tracking-wider bg-blue-50 px-2 py-1 rounded">
                    {otp.otp}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      otp.purpose === "signup"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {otp.purpose}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      otp.is_verified
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {otp.is_verified ? "Used" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  <div className="flex flex-col">
                    <span>
                      Exp: {new Date(otp.expires_at).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-400">
                      {new Date(otp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {otps.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No active OTP codes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OTPViewer;
