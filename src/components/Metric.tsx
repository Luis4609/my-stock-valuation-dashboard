import React from "react";
import type { MetricProps } from "../types/types";

export const Metric: React.FC<MetricProps> = ({ label, value, tooltip }) => (
  <div className="relative flex flex-col bg-gray-800 p-4 rounded-lg shadow-md group h-full">
    <dt className="text-sm font-medium text-gray-400 truncate">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold text-white">{value}</dd>
    {tooltip && (
      <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-900 text-white text-xs rounded py-1 px-2 z-10">
        {tooltip}
      </div>
    )}
  </div>
);
