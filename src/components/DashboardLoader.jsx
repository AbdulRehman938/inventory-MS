import React, { useEffect, useState } from "react";

const DashboardLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 200);
          return 100;
        }
        return prev + 2;
      });
    }, 60); // 3 seconds total (3000ms / 50 steps)

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center z-50">
      <div className="text-center space-y-8 px-4">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
            <span className="text-4xl font-bold text-blue-600">IMS</span>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white animate-pulse">
            Loading Dashboard
          </h2>
          <p className="text-blue-200 text-lg">
            Preparing your workspace...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 max-w-full mx-auto space-y-2">
          <div className="w-full bg-blue-900/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white/30 animate-shimmer"></div>
            </div>
          </div>
          <p className="text-blue-200 text-sm font-medium">{progress}%</p>
        </div>

        {/* Spinner */}
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLoader;
