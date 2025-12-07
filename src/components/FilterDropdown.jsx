import React, { useState, useRef, useEffect } from "react";
import { MdExpandMore, MdCheck } from "react-icons/md";

const FilterDropdown = ({ value, onChange, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const allOptions = ["all", ...categories];

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
  };

  const getDisplayText = (val) => {
    return val === "all" ? "All Categories" : val;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 min-w-[180px] justify-between transition-all hover:border-blue-500"
      >
        <span>{getDisplayText(value)}</span>
        <MdExpandMore
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl animate-slideDown max-h-60 overflow-y-auto">
          {allOptions.map((category) => (
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
              <span>{getDisplayText(category)}</span>
              {value === category && <MdCheck className="w-5 h-5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
