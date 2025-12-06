import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  MdClose,
  MdSave,
  MdEdit,
  MdFileDownload,
  MdVerified,
  MdCheckCircle,
  MdCancel,
  MdQuestionMark,
  MdDateRange,
  MdArrowDropDown,
} from "react-icons/md";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getBiodata,
  saveBiodata,
  requestBiodataVerification,
  getCurrentUserProfile,
} from "../services/userService";

// Validation Schema
const validationSchema = Yup.object().shape({
  dob: Yup.date().required("Date of Birth is required"),
  mobileNumber: Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .required("Mobile Number is required"),
  gender: Yup.string().required("Gender is required"),
  nationality: Yup.string().required("Nationality is required"),
  maritalStatus: Yup.string().required("Marital Status is required"),
  currentAddress: Yup.string().required("Current Address is required"),
  permanentAddress: Yup.string().required("Permanent Address is required"),
  emergencyContactName: Yup.string().required(
    "Emergency Contact Name is required"
  ),
  emergencyContactNumber: Yup.string()
    .matches(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .required("Emergency Contact Number is required"),
  qualification: Yup.string().required("Qualification is required"),
  jobTitle: Yup.string().required("Job Title is required"),
  experience: Yup.number()
    .min(0, "Experience cannot be negative")
    .required("Experience is required"),
  noticePeriod: Yup.string().required("Notice Period is required"),
  certifications: Yup.string(),
  skills: Yup.string().required("Skills are required"),
  languages: Yup.string().required("Languages are required"),
  reference: Yup.string(),
});

const BiodataModal = ({ onClose, userId }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, pending, approved, rejected
  const [adminRemarks, setAdminRemarks] = useState(null);
  const [adminDetails, setAdminDetails] = useState(null); // For PDF
  const [userProfileName, setUserProfileName] = useState("");

  const customSelectStyles =
    "w-full p-2.5 border rounded-lg outline-none transition-all appearance-none bg-white text-gray-800 focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200";

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      dob: "",
      mobileNumber: "",
      gender: "",
      nationality: "",
      maritalStatus: "",
      currentAddress: "",
      permanentAddress: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      qualification: "",
      jobTitle: "",
      experience: "",
      noticePeriod: "",
      certifications: "",
      skills: "",
      languages: "",
      reference: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const result = await saveBiodata(userId, values);
      setLoading(false);
      if (result.success) {
        toast.success("Biodata saved successfully!");
        setIsEditing(false);
        // Refresh status if needed
        setVerificationStatus("idle"); // reset status to idle on new save/edit (implied logic) or keep it?
        // Let's re-fetch to be safe and sync with DB logic
        fetchBiodata();
      } else {
        toast.error("Failed to save biodata: " + result.message);
      }
    },
  });

  // Show validation errors toast
  useEffect(() => {
    if (formik.submitCount > 0 && !formik.isValid) {
      toast.error("Please fix the validation errors in the form.");
    }
  }, [formik.submitCount, formik.isValid]);

  useEffect(() => {
    fetchBiodata();
  }, [userId]);

  const fetchBiodata = async () => {
    setFetching(true);
    const profileResult = await getCurrentUserProfile(userId);
    if (profileResult.success) {
      setUserProfileName(profileResult.data.full_name);
    }

    const result = await getBiodata(userId);
    if (result.success && result.data) {
      formik.setValues(result.data);
      // If data exists, default to view mode
      setIsEditing(false);
      setVerificationStatus(result.data.verification_status || "idle");
      setAdminRemarks(result.data.admin_remarks);
      setAdminDetails(result.data.admin_details); // Assuming backend returns who approved it
    }
    setFetching(false);
  };

  const handleRequestVerification = async () => {
    if (isEditing) {
      toast.warning("Please save your changes first.");
      return;
    }
    setLoading(true);
    const result = await requestBiodataVerification(userId);
    setLoading(false);
    if (result.success) {
      toast.success("Verification requested successfully!");
      setVerificationStatus("pending");
    } else {
      toast.error("Failed to request verification: " + result.message);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const primaryColor = [30, 41, 59]; // Slate 800
    const accentColor = [59, 130, 246]; // Blue 500

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");

    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("INVENTORY MANAGER", 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("Official Employee Biodata Record", 15, 28);

    // Official Verification Stamp
    if (verificationStatus === "approved") {
      doc.setFillColor(220, 252, 231); // Green 100
      doc.setDrawColor(22, 163, 74); // Green 600
      doc.roundedRect(150, 10, 45, 20, 2, 2, "FD");

      doc.setTextColor(22, 163, 74);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("VERIFIED", 172.5, 20, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Authorized by Admin", 172.5, 26, { align: "center" });
    }

    doc.setTextColor(0, 0, 0);

    // Personal Info Section
    autoTable(doc, {
      startY: 50,
      head: [["Information", "Details"]],
      body: [
        ["Employee Name", userProfileName || "N/A"],
        [
          "Date of Birth",
          formik.values.dob
            ? new Date(formik.values.dob).toLocaleDateString()
            : "N/A",
        ],
        ["Gender", formik.values.gender],
        ["Nationality", formik.values.nationality],
        ["Marital Status", formik.values.maritalStatus],
        ["Mobile", formik.values.mobileNumber],
        ["Current Address", formik.values.currentAddress],
        ["Permanent Address", formik.values.permanentAddress],
      ],
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });

    // Professional Section
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Professional Profile", ""]],
      body: [
        ["Job Title", formik.values.jobTitle],
        ["Qualification", formik.values.qualification],
        ["Experience", `${formik.values.experience} Years`],
        ["Skills", formik.values.skills],
        ["Languages", formik.values.languages],
        ["Certifications", formik.values.certifications || "-"],
      ],
      theme: "striped",
      headStyles: { fillColor: accentColor },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    });

    // Admin Section
    if (verificationStatus === "approved" && adminDetails) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Verification Details", ""]],
        body: [
          ["Verified By", adminDetails.name || "Administrator"],
          [
            "Date Approved",
            adminDetails.date
              ? new Date(adminDetails.date).toLocaleString()
              : "N/A",
          ],
          [
            "Admin Remarks",
            adminRemarks || "Verified successfully without remarks.",
          ],
        ],
        theme: "plain",
        styles: { fontSize: 9, textColor: [80, 80, 80] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 285);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: "right" });
    }

    doc.save(`${userProfileName.replace(/\s+/g, "_")}_Biodata.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-600 rounded-full inline-block"></span>
              Employee Biodata
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage detailed personal and professional information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <MdClose className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Verification Status
            </span>
            {verificationStatus === "approved" && (
              <span className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm bg-green-100 dark:bg-green-900/30 px-4 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                <MdVerified className="w-4 h-4" /> Verified
              </span>
            )}
            {verificationStatus === "pending" && (
              <span className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm bg-orange-100 dark:bg-orange-900/30 px-4 py-1.5 rounded-full border border-orange-200 dark:border-orange-800">
                <MdQuestionMark className="w-4 h-4" /> Pending Approval
              </span>
            )}
            {verificationStatus === "rejected" && (
              <span className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm bg-red-100 dark:bg-red-900/30 px-4 py-1.5 rounded-full border border-red-200 dark:border-red-800">
                <MdCancel className="w-4 h-4" /> Rejected
              </span>
            )}
            {verificationStatus === "idle" && (
              <span className="text-gray-600 dark:text-gray-400 text-sm bg-gray-200 dark:bg-gray-700 px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600">
                Not Verified
              </span>
            )}
          </div>
          <div>
            {verificationStatus === "rejected" && adminRemarks && (
              <span className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded border border-red-100">
                Remark: {adminRemarks}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        {fetching ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form
            onSubmit={formik.handleSubmit}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar no-scrollbar bg-gray-50/50 dark:bg-slate-900/50 sm:p-6 md:p-8">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
              >
                {/* Personal Information Header */}
                <div className="col-span-1 md:col-span-2 pb-2 mb-4 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Personal Information
                  </h3>
                </div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={
                        formik.values.dob ? new Date(formik.values.dob) : null
                      }
                      onChange={(date) => formik.setFieldValue("dob", date)}
                      dateFormat="yyyy-MM-dd"
                      disabled={!isEditing}
                      className={customSelectStyles}
                      placeholderText="Select Date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <MdDateRange className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                  {formik.touched.dob && formik.errors.dob && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.dob}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      {...formik.getFieldProps("gender")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} cursor-pointer`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                  {formik.touched.gender && formik.errors.gender && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.gender}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Marital Status
                  </label>
                  <div className="relative">
                    <select
                      {...formik.getFieldProps("maritalStatus")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} cursor-pointer`}
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Nationality
                  </label>
                  <div className="relative">
                    <select
                      {...formik.getFieldProps("nationality")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} cursor-pointer`}
                    >
                      <option value="">Select Nationality</option>
                      <option value="Indian">Indian</option>
                      <option value="American">American</option>
                      <option value="British">British</option>
                      <option value="Canadian">Canadian</option>
                      <option value="Australian">Australian</option>
                      <option value="Other">Other</option>
                    </select>
                    <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    {...formik.getFieldProps("mobileNumber")}
                    disabled={!isEditing}
                    className={customSelectStyles}
                    placeholder="+91 98765 43210"
                  />
                  {formik.touched.mobileNumber &&
                    formik.errors.mobileNumber && (
                      <div className="text-red-500 text-xs">
                        {formik.errors.mobileNumber}
                      </div>
                    )}
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                      Current Address
                    </label>
                    <textarea
                      rows={3}
                      {...formik.getFieldProps("currentAddress")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} resize-none`}
                      placeholder="Enter full current address"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                      Permanent Address
                    </label>
                    <textarea
                      rows={3}
                      {...formik.getFieldProps("permanentAddress")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} resize-none`}
                      placeholder="Enter full permanent address"
                    />
                  </div>
                </motion.div>

                {/* Professional Info Header */}
                <div className="col-span-1 md:col-span-2 pb-2 mt-6 mb-4 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Professional Information
                  </h3>
                </div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Job Title
                  </label>
                  <div className="relative">
                    <select
                      {...formik.getFieldProps("jobTitle")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} cursor-pointer`}
                    >
                      <option value="">Select Job Title</option>
                      <option value="Software Engineer">
                        Software Engineer
                      </option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Controller">Controller</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Sales Executive">Sales Executive</option>
                      <option value="Other">Other</option>
                    </select>
                    <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Qualification
                  </label>
                  <div className="relative">
                    <select
                      {...formik.getFieldProps("qualification")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} cursor-pointer`}
                    >
                      <option value="">Select Qualification</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's Degree">
                        Bachelor's Degree
                      </option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Diploma">Diploma</option>
                    </select>
                    <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    {...formik.getFieldProps("experience")}
                    disabled={!isEditing}
                    className={customSelectStyles}
                    placeholder="e.g. 5"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Notice Period
                  </label>
                  <div className="relative">
                    <select
                      {...formik.getFieldProps("noticePeriod")}
                      disabled={!isEditing}
                      className={`${customSelectStyles} cursor-pointer`}
                    >
                      <option value="">Select Period</option>
                      <option value="Immediate">Immediate</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="60 Days">60 Days</option>
                      <option value="90 Days">90 Days</option>
                    </select>
                    <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="col-span-2 space-y-1.5"
                >
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Skills
                  </label>
                  <textarea
                    rows={2}
                    {...formik.getFieldProps("skills")}
                    disabled={!isEditing}
                    className={`${customSelectStyles} resize-none`}
                    placeholder="e.g. React, Node.js, Project Management"
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="col-span-2 space-y-1.5"
                >
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Languages
                  </label>
                  <textarea
                    rows={2}
                    {...formik.getFieldProps("languages")}
                    disabled={!isEditing}
                    className={`${customSelectStyles} resize-none`}
                    placeholder="e.g. English, Spanish, Hindi"
                  />
                </motion.div>
                {/* Emergency Contact Header */}
                <div className="col-span-1 md:col-span-2 pb-2 mt-6 mb-4 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Emergency Contact
                  </h3>
                </div>
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    {...formik.getFieldProps("emergencyContactName")}
                    disabled={!isEditing}
                    className={customSelectStyles}
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wide">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    {...formik.getFieldProps("emergencyContactNumber")}
                    disabled={!isEditing}
                    className={customSelectStyles}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 z-10 shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      formik.resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    {loading ? (
                      "Saving..."
                    ) : (
                      <>
                        <MdSave className="w-5 h-5" /> Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex w-full justify-between">
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    disabled={
                      loading ||
                      verificationStatus === "pending" ||
                      verificationStatus === "approved"
                    }
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      verificationStatus === "approved"
                        ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 cursor-default"
                        : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600"
                    }`}
                  >
                    {verificationStatus === "approved" ? (
                      <>
                        <MdVerified /> Verified
                      </>
                    ) : verificationStatus === "pending" ? (
                      "Verification Pending..."
                    ) : (
                      "Request Certification"
                    )}
                  </button>

                  <div className="flex gap-3">
                    {verificationStatus === "approved" && (
                      <button
                        type="button"
                        onClick={generatePDF}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
                      >
                        <MdFileDownload className="w-5 h-5" /> Download Verified
                        PDF
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                      <MdEdit className="w-5 h-5" /> Edit Biodata
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default BiodataModal;
