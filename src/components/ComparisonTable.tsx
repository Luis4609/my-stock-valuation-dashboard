import React from "react";
import type { ComparisonTableProps } from "../types/types";

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  peers,
  mainStock,
}) => {
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num) || !isFinite(num))
      return "–";
    if (num > 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    return num.toFixed(2);
  };

  const peerStats = peers.filter((p) => p.pe && p.mktCap);
  const avgPE = peerStats.reduce((acc, p) => acc + p.pe!, 0) / peerStats.length;
  const avgMktCap =
    peerStats.reduce((acc, p) => acc + p.mktCap!, 0) / peerStats.length;

  const allStocks = [
    {
      symbol: mainStock.profile.symbol,
      pe: mainStock.quote.pe,
      mktCap: mainStock.profile.mktCap,
      isMain: true,
    },
    ...peers.map((p) => ({ ...p, isMain: false })),
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-bold text-center mb-4">
        Comparativa de Competidores
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Ticker</th>
              <th className="p-2">P/E Ratio</th>
              <th className="p-2">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {allStocks.map((stock) => (
              <tr
                key={stock.symbol}
                className={`${
                  stock.isMain ? "bg-blue-900/50" : ""
                } border-b border-gray-700/50`}
              >
                <td className="p-2 font-bold">{stock.symbol}</td>
                <td className="p-2">{formatNumber(stock.pe)}</td>
                <td className="p-2">${formatNumber(stock.mktCap)}</td>
              </tr>
            ))}
            <tr className="bg-gray-900 font-bold">
              <td className="p-2">Promedio del Sector</td>
              <td className="p-2">{formatNumber(avgPE)}</td>
              <td className="p-2">${formatNumber(avgMktCap)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
