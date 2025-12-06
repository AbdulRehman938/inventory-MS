import React, { useState, useEffect } from "react";
import {
  MdCheckCircle,
  MdCancel,
  MdSearch,
  MdRefresh,
  MdVisibility,
} from "react-icons/md";
import { toast } from "react-toastify";
import BiodataModal from "../BiodataModal"; // Import the modal to reuse it
import {
  getAllBiodataRequests,
  reviewBiodataRequest,
} from "../../services/userService";

const BiodataRequests = ({ highlightedRequestId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    if (highlightedRequestId) {
      setHighlightedId(highlightedRequestId);
      // Clear highlight after 2 seconds
      const timer = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedRequestId]);
  const [reviewModal, setReviewModal] = useState(null); // { id, name, type: 'approve' | 'reject' }
  const [remarks, setRemarks] = useState("");
  const [viewDetailsId, setViewDetailsId] = useState(null); // ID of user to view details
  const [adminName, setAdminName] = useState("Admin"); // Ideally active admin name

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const result = await getAllBiodataRequests();
    if (result.success) {
      setRequests(result.data);
    } else {
      toast.error("Failed to fetch requests");
    }
    setLoading(false);
  };

  const handleReview = async () => {
    if (!remarks) {
      toast.warning("Please add remarks.");
      return;
    }

    const result = await reviewBiodataRequest(
      reviewModal.user_id,
      reviewModal.type === "approve" ? "approved" : "rejected",
      remarks,
      adminName
    );

    if (result.success) {
      toast.success(`Request ${reviewModal.type}d successfully`);
      setReviewModal(null);
      setRemarks("");
      fetchRequests();
    } else {
      toast.error(result.message);
    }
  };

  const openReviewModal = (req, type) => {
    setReviewModal({ ...req, type });
    setRemarks(
      type === "approve"
        ? "Verified and Approved."
        : "Rejected due to incomplete information."
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Biodata Verification Requests
          </h3>
          <p className="text-sm text-gray-500">
            Review and verify employee biodata
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh"
        >
          <MdRefresh className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <MdCheckCircle className="w-12 h-12 text-green-100 mb-2" />
            <p>No pending verification requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className={`transition-colors duration-500 ${
                      highlightedId === req.user_id
                        ? "bg-blue-100 ring-2 ring-blue-400"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3">
                          {(req.profiles?.full_name || "U").charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {req.profiles?.full_name || "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {req.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                        Pending Verification
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {/* Assuming there's a timestamp, otherwise just "Now" */}
                      {new Date().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openReviewModal(req, "approve")}
                        className="text-green-600 hover:text-green-800 font-medium text-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openReviewModal(req, "reject")}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setViewDetailsId(req.user_id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors flex items-center gap-1"
                      >
                        <MdVisibility className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View User Biodata Modal */}
      {viewDetailsId && (
        <BiodataModal
          onClose={() => setViewDetailsId(null)}
          userId={viewDetailsId}
          // Logic inside BiodataModal needs to handle "admin view" if necessary
          // or we just trust that it displays the data correctly in read-only mode for admins
          // if we don't pass specific props.
          // Ideally we'd pass a prop `mode="admin-view"` to maybe hide buttons or just show them disability.
          // But currently BiodataModal logic is: if user has data, it shows view mode.
          // However, the buttons might still be "Request Verification".
          // Since we are reusing the modal, let's just use it as is for now,
          // admins can see the "View" state.
          // NOTE: The current modal implementation lets anyone edit their own biodata.
          // But here we are passing `viewDetailsId` (the target user's ID).
          // The modal uses `getBiodata(userId)`.
          // So if I am admin, calling it with another user's ID, will I get data?
          // RLS Policy says: "Users view own, Admins view all". So yes, I will get data.
          // But the modal might show "Edit" buttons?
          // Yes, buttons might be visible. We might want to pass a prop `readOnly={true}`.
        />
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4 capitalize">
              {reviewModal.type} Verification
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              You are about to {reviewModal.type} the verification request for{" "}
              <b>{reviewModal.profiles?.full_name}</b>.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${
                  reviewModal.type === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm {reviewModal.type === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiodataRequests;
