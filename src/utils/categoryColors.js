// Generate consistent colors for categories
const categoryColorMap = new Map();

const colorPalette = [
  { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
  { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  { bg: "bg-lime-50 dark:bg-lime-900/20", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-800" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  { bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-800" },
  { bg: "bg-sky-50 dark:bg-sky-900/20", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
];

export const getCategoryColor = (category) => {
  if (!category) {
    return { bg: "bg-gray-50 dark:bg-gray-900/20", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800" };
  }

  // Check if we already assigned a color to this category
  if (categoryColorMap.has(category)) {
    return categoryColorMap.get(category);
  }

  // Assign a new color based on the current map size
  const colorIndex = categoryColorMap.size % colorPalette.length;
  const color = colorPalette[colorIndex];
  categoryColorMap.set(category, color);

  return color;
};

export const resetCategoryColors = () => {
  categoryColorMap.clear();
};
