import React from "react";
import { MdClose } from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

const ChartDetailModal = ({ onClose, title, data, type }) => {
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  const renderChart = () => {
    switch (type) {
      case "sales":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient
                  id="colorRevenueModal"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f5f5f5" opacity={0.1} />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis
                yAxisId="left"
                fontSize={12}
                orientation="left"
                stroke="#3b82f6"
              />
              <YAxis
                yAxisId="right"
                fontSize={12}
                orientation="right"
                stroke="#10b981"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#fff",
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue ($)"
                fill="url(#colorRevenueModal)"
                stroke="#3b82f6"
                strokeWidth={3}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sales"
                name="Orders"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case "activity":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="hour" fontSize={12} tickMargin={10} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                name="Logins"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "topSelling":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                opacity={0.1}
              />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" width={150} fontSize={12} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="quantity"
                fill="#10b981"
                name="Quantity Sold"
                radius={[0, 4, 4, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "stock":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                fontSize={11}
                angle={-30}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="quantity"
                fill="#f59e0b"
                name="In Stock"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "category":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                opacity={0.1}
              />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" width={150} fontSize={12} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="value"
                name="Items"
                radius={[0, 4, 4, 0]}
                barSize={30}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return <div>No Chart Data</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col animate-scaleIn shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 bg-white dark:bg-slate-800">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ChartDetailModal;
