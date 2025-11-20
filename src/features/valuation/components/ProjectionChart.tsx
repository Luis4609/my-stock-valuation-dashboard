import React from "react";
import type { ProjectionChartProps } from "../../../types/types";

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  data,
  currentPrice,
}) => {
  if (!data || data.length === 0) return null;
  const width = 500,
    height = 300,
    padding = 50;
  const allPrices = [currentPrice, ...data.map((p) => p.price)];
  const minPrice = Math.min(...allPrices) * 0.95;
  const maxPrice = Math.max(...allPrices) * 1.05;
  const getX = (index: number): number =>
    padding + (index / data.length) * (width - padding * 2);
  const getY = (price: number): number =>
    height -
    padding -
    ((price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
  const linePath = data.reduce(
    (acc, point, i) => `${acc} L ${getX(i + 1)} ${getY(point.price)}`,
    `M ${getX(0)} ${getY(currentPrice)}`
  );

  return (
    <div className="mt-6 bg-gray-900 p-4 rounded-lg">
      <h4 className="text-lg font-semibold text-center mb-2">
        Proyección de Precio a 5 Años
      </h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[...Array(5)].map((_, i) => {
          const price = minPrice + (i / 4) * (maxPrice - minPrice);
          const y = getY(price);
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#4A5568"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 10}
                y={y + 5}
                fill="#A0AEC0"
                fontSize="10"
                textAnchor="end"
              >
                ${price.toFixed(2)}
              </text>
            </g>
          );
        })}
        {data.map((point, i) => (
          <text
            key={point.year}
            x={getX(i + 1)}
            y={height - padding + 20}
            fill="#A0AEC0"
            fontSize="10"
            textAnchor="middle"
          >
            {point.year}
          </text>
        ))}
        <text
          x={getX(0)}
          y={height - padding + 20}
          fill="#A0AEC0"
          fontSize="10"
          textAnchor="middle"
        >
          Actual
        </text>
        <path d={linePath} fill="none" stroke="#38B2AC" strokeWidth="2" />
        <circle cx={getX(0)} cy={getY(currentPrice)} r="4" fill="#38B2AC" />
        {data.map((point, i) => (
          <circle
            key={point.year}
            cx={getX(i + 1)}
            cy={getY(point.price)}
            r="4"
            fill="#38B2AC"
          />
        ))}
      </svg>
    </div>
  );
};
