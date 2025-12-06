import React from "react";

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Side Skeleton (Form) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 z-20">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Skeleton */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse mb-4"></div>
            <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-5 w-full flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-full bg-blue-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Right Side Skeleton (Spline Area) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gray-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"></div>
        <div className="z-10 text-center space-y-4 p-8">
          <div className="h-10 w-64 bg-gray-700 rounded mx-auto animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-700/50 rounded mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
