import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave } from "react-icons/md";
import { toast } from "react-toastify";
import DashboardLayout from "../layouts/DashboardLayout";

const Biodata = () => {
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("sb-kvk-auth-token") || "{}")
    ?.user?.id;
  const userRole = localStorage.getItem("userRole") || "controller";

  const [formData, setFormData] = useState({
    dob: "",
    mobileNumber: "",
    gender: "",
    nationality: "",
    maritalStatus: "",
    currentAddress: "",
    permanentAddress: "",
    qualification: "",
    certifications: "",
    experience: "",
    jobTitle: "",
    skills: "",
    languages: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    reference: "",
    noticePeriod: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`user_biodata_${userId}`);
      if (saved) {
        setFormData(JSON.parse(saved));
      }
    }
    setLoading(false);
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (userId) {
      localStorage.setItem(`user_biodata_${userId}`, JSON.stringify(formData));
      toast.success("Biodata saved successfully!");
    } else {
      toast.error("User ID not found");
    }
  };

  return (
    <DashboardLayout role={userRole}>
      <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
              <MdArrowBack className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Employee Biodata Details
              </h1>
              <p className="text-sm text-gray-500">
                Manage your detailed personal and professional information
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <MdSave className="w-5 h-5" /> Save Details
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="col-span-2 pb-4 border-b border-gray-50">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Personal Information
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Marital Status
              </label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white"
              >
                <option value="">Select...</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">{/* Spacing */}</div>

            <div className="col-span-2 pt-4 pb-4 border-b border-gray-50 border-t border-gray-50 mt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Contact & Address
              </h3>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Current Address
              </label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Permanent Address
              </label>
              <textarea
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Emergency Contact Person
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Emergency Contact Number
              </label>
              <input
                type="tel"
                name="emergencyContactNumber"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="col-span-2 pt-4 pb-4 border-b border-gray-50 border-t border-gray-50 mt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Professional Details
              </h3>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Highest Qualification
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Current Job Title / Role
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Work Experience (Years)
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Availability / Notice Period
              </label>
              <input
                type="text"
                name="noticePeriod"
                value={formData.noticePeriod}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Professional Certifications
              </label>
              <input
                type="text"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="e.g. PMP, AWS Certified..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Skills / Technical Expertise
              </label>
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                placeholder="e.g. React, Node.js, Project Management..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Languages Known
              </label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Reference (Optional)
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Biodata;
