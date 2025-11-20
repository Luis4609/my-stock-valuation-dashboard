import React, { useState, useEffect } from "react";
import type { StockData, ProjectionPoint } from "../../../types/types";
import { ProjectionChart } from "./ProjectionChart";

interface DcfCalculatorProps {
    stockData: StockData;
}

export const DcfCalculator: React.FC<DcfCalculatorProps> = ({ stockData }) => {
    const [inputs, setInputs] = useState({
        currentEps: 0,
        epsGrowthRate: 15,
        terminalMultiple: 20,
        discountRate: 15,
    });

    const [results, setResults] = useState<{
        entryPrice: number;
        expectedReturn: number;
        futurePrice: number;
        projections: ProjectionPoint[];
    } | null>(null);

    // Initialize inputs when stockData changes
    useEffect(() => {
        if (stockData) {
            const eps = stockData.quote?.eps ?? stockData.metrics?.epsTTM ?? 0;
            const pe = stockData.quote?.pe ?? stockData.ratios?.priceEarningsRatioTTM ?? 20;

            setInputs((prev) => ({
                ...prev,
                currentEps: parseFloat(eps.toFixed(2)),
                terminalMultiple: parseFloat(pe.toFixed(2)),
            }));
        }
    }, [stockData]);

    // Calculate whenever inputs change
    useEffect(() => {
        calculateValues();
    }, [inputs]);

    const calculateValues = () => {
        const { currentEps, epsGrowthRate, terminalMultiple, discountRate } = inputs;
        const years = 5;
        const currentPrice = stockData.profile.price;

        if (currentEps === 0) {
            setResults(null);
            return;
        }

        // Calculate Future EPS and Price
        const futureEps = currentEps * Math.pow(1 + epsGrowthRate / 100, years);
        const futurePrice = futureEps * terminalMultiple;

        // Calculate Entry Price (Intrinsic Value) for desired return
        const entryPrice = futurePrice / Math.pow(1 + discountRate / 100, years);

        // Calculate Expected Return (CAGR) from current price
        // Formula: (FuturePrice / CurrentPrice)^(1/n) - 1
        let expectedReturn = 0;
        if (currentPrice > 0) {
            expectedReturn = (Math.pow(futurePrice / currentPrice, 1 / years) - 1) * 100;
        }

        // Generate Projections for Chart
        const projections: ProjectionPoint[] = [];
        const currentYear = new Date().getFullYear();

        for (let i = 1; i <= years; i++) {
            const projectedEps = currentEps * Math.pow(1 + epsGrowthRate / 100, i);
            // We assume the PE multiple converges linearly or stays constant? 
            // The simple model usually just projects price based on EPS growth * constant PE, 
            // or linear interpolation of PE. Let's stick to constant PE for the projection line 
            // to show the "growth trajectory" implied by the inputs.
            const projectedPrice = projectedEps * terminalMultiple;
            projections.push({
                year: currentYear + i,
                price: projectedPrice
            });
        }

        setResults({
            entryPrice,
            expectedReturn,
            futurePrice,
            projections
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    if (!stockData) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
            <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                <h3 className="text-2xl font-bold text-white">DCF Calculator</h3>
                <div className="flex gap-4 text-sm">
                    <div className="bg-gray-700 px-3 py-1 rounded-lg">
                        <span className="text-gray-400 block text-xs">EPS (TTM)</span>
                        <span className="font-bold text-white">${inputs.currentEps}</span>
                    </div>
                    <div className="bg-gray-700 px-3 py-1 rounded-lg">
                        <span className="text-gray-400 block text-xs">PE (TTM)</span>
                        <span className="font-bold text-white">
                            {(stockData.quote?.pe ?? stockData.ratios?.priceEarningsRatioTTM ?? 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="bg-gray-700 px-3 py-1 rounded-lg">
                        <span className="text-gray-400 block text-xs">Growth</span>
                        <span className="font-bold text-green-400">
                            {(stockData.metrics?.growthEPS ? (stockData.metrics.growthEPS * 100).toFixed(2) : "–")}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            EPS (TTM)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="currentEps"
                                value={inputs.currentEps}
                                onChange={handleInputChange}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">The Earnings Per Share over the last 12 months.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            EPS Growth Rate (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="epsGrowthRate"
                                value={inputs.epsGrowthRate}
                                onChange={handleInputChange}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-8 py-3 focus:outline-none focus:border-blue-500 text-white font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Expected yearly EPS growth rate for the next 5 years.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Appropriate EPS Multiple
                        </label>
                        <input
                            type="number"
                            name="terminalMultiple"
                            value={inputs.terminalMultiple}
                            onChange={handleInputChange}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-white font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">The PE ratio you consider appropriate for the stock to trade at in 5 years.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Desired Return (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="discountRate"
                                value={inputs.discountRate}
                                onChange={handleInputChange}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-8 py-3 focus:outline-none focus:border-blue-500 text-white font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Annualized return you aim to achieve.</p>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 flex flex-col">
                    <h4 className="text-lg font-semibold text-gray-300 mb-6">Calculation Results</h4>

                    {results ? (
                        <>
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Return from today's price</p>
                                    <p className={`text-3xl font-bold ${results.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {results.expectedReturn.toFixed(2)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Entry Price for {inputs.discountRate}% Return</p>
                                    <p className="text-3xl font-bold text-blue-400">
                                        ${results.entryPrice.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-grow">
                                <ProjectionChart data={results.projections} currentPrice={stockData.profile.price} />
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                                Projected Future Price (5yr): <span className="text-gray-300">${results.futurePrice.toFixed(2)}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-gray-500">
                            Enter valid inputs to see projections.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
