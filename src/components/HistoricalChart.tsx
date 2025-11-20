import React from "react";
import type { HistoricalChartProps } from "../types/types";

export const HistoricalChart: React.FC<HistoricalChartProps> = ({ data }) => {
  if (!data || data.length === 0)
    return <div className="text-center p-4">No historical data available.</div>;
  const width = 500,
    height = 300,
    padding = 50;
  const reversedData = [...data].reverse();
  const minEps = Math.min(...reversedData.map((d) => d.eps)) * 0.9;
  const maxEps = Math.max(...reversedData.map((d) => d.eps)) * 1.1;
  const getX = (index: number): number =>
    padding + (index / (reversedData.length - 1)) * (width - padding * 2);
  const getY = (eps: number): number =>
    height -
    padding -
    ((eps - minEps) / (maxEps - minEps)) * (height - padding * 2);
  const linePath = reversedData.reduce(
    (acc, point, i) => `${acc} L ${getX(i)} ${getY(point.eps)}`,
    `M ${getX(0)} ${getY(reversedData[0].eps)}`
  );

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-bold text-center mb-4">
        Evolución del EPS (5 Años)
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[...Array(6)].map((_, i) => {
          const eps = minEps + (i / 5) * (maxEps - minEps);
          const y = getY(eps);
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
                ${eps.toFixed(2)}
              </text>
            </g>
          );
        })}
        {reversedData.map((d, i) => (
          <text
            key={d.date}
            x={getX(i)}
            y={height - padding + 20}
            fill="#A0AEC0"
            fontSize="10"
            textAnchor="middle"
          >
            {new Date(d.date).getFullYear()}
          </text>
        ))}
        <path d={linePath} fill="none" stroke="#38B2AC" strokeWidth="2" />
        {reversedData.map((d, i) => (
          <circle
            key={d.date}
            cx={getX(i)}
            cy={getY(d.eps)}
            r="4"
            fill="#38B2AC"
          />
        ))}
      </svg>
    </div>
  );
};
