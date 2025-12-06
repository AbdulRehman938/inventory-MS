import React from "react";

const DashboardSkeleton = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white shadow-lg hidden md:flex flex-col">
        <div className="h-16 flex items-center justify-center border-b px-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
        <div className="p-4 border-t">
          <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
          </div>
        </header>

        {/* Dashboard Widgets Skeleton */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm h-32 animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>

          {/* Recent Activity / Table Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-96 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
