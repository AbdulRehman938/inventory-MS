import React, { useState, useRef, useEffect } from "react";
import { MdExpandMore, MdCheck } from "react-icons/md";

const CategoryDropdown = ({ value, onChange, categories, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const predefinedCategories = [
    "Grocery",
    "Beverages",
    "Electronics",
    "Clothing",
    "Furniture",
    "Stationery",
    "Hardware",
    "Cosmetics",
    "Pharmaceuticals",
    "Sports Equipment",
  ];

  const allCategories = [
    ...new Set([...predefinedCategories, ...categories]),
  ].sort();

  const filteredCategories = allCategories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (category) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Category {required && "*"}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between transition-all"
      >
        <span className={value ? "" : "text-gray-400"}>
          {value || "Select a category"}
        </span>
        <MdExpandMore
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl animate-slideDown">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-slate-600">
            <input
              type="text"
              placeholder="Search or type new category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {searchTerm && !filteredCategories.includes(searchTerm) && (
              <button
                type="button"
                onClick={() => handleSelect(searchTerm)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm border-b border-gray-100 dark:border-slate-600"
              >
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  + Create "{searchTerm}"
                </span>
              </button>
            )}

            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-between text-sm ${
                    value === category
                      ? "bg-blue-50 dark:bg-slate-600 text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  <span>{category}</span>
                  {value === category && <MdCheck className="w-5 h-5" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
