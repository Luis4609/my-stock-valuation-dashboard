import React, { useState } from "react";
import { useStockData } from "./hooks/useStockData";
import { useAiAnalysis } from "./hooks/useAiAnalysis";
import { formatNumber, formatPercentage } from "./shared/utils/formatting";

// Feature Components
import { Metric } from "./features/dashboard/components/Metric";
import { FinancialChecklist } from "./features/dashboard/components/FinancialChecklist";
import { HistoricalChart } from "./features/dashboard/components/HistoricalChart";
import { ComparisonTable } from "./features/comparison/components/ComparisonTable";
import { Watchlist } from "./features/watchlist/components/Watchlist";
import { DcfCalculator } from "./features/valuation/components/DcfCalculator";

// Shared UI
import { Spinner } from "./shared/ui/Spinner";
import { ErrorMessage } from "./shared/ui/ErrorMessage";

const App: React.FC = () => {
  const [ticker, setTicker] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  const { stockData, isLoading, error, fetchStockData, clearStockData } = useStockData();
  const { isAnalyzing, analysisResult, error: aiError, analyzeStock, clearAnalysis } = useAiAnalysis();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    fetchStockData(ticker);
    clearAnalysis();
  };

  const handleClear = (): void => {
    setTicker("");
    clearStockData();
    clearAnalysis();
  };

  const handleWatchlistSelect = (symbol: string) => {
    setTicker(symbol);
    fetchStockData(symbol);
    clearAnalysis();
  };

  const handleAiAnalysis = () => {
    if (stockData) {
      analyzeStock(stockData);
    }
  };

  const TabButton = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === id ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-400"
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-400">
            Stock Valuation Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Enter a stock ticker to get key financial metrics.
          </p>
        </header>

        <Watchlist onSelectTicker={handleWatchlistSelect} />

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g., AAPL, GOOGL, MSFT"
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-4xl mx-auto">
          {isLoading && <Spinner />}
          {error && <ErrorMessage message={error} />}
          {aiError && <ErrorMessage message={aiError} />}

          {stockData && (
            <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border-l-4 border-blue-500">
              {/* Header Section */}
              <div className="flex items-center gap-4 border-b border-gray-700 pb-4 mb-6">
                <img
                  src={stockData.profile.image}
                  alt={`${stockData.profile.companyName} logo`}
                  className="h-16 w-16 rounded-full bg-white p-1"
                />
                <div>
                  <h2 className="text-3xl font-bold">
                    {stockData.profile.companyName} ({stockData.profile.symbol})
                  </h2>
                  <p className="text-gray-400">
                    {stockData.profile.exchangeShortName} | {stockData.profile.industry}
                  </p>
                  <a
                    href={stockData.profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {stockData.profile.website}
                  </a>
                </div>
                <div className="ml-auto text-right">
                  <p className={`text-4xl font-bold ${stockData.profile.changes > 0 ? "text-green-400" : "text-red-400"}`}>
                    ${formatNumber(stockData.profile.price)}
                  </p>
                  <p className={`text-lg font-semibold ${stockData.profile.changes > 0 ? "text-green-400" : "text-red-400"}`}>
                    {stockData.profile.changes > 0 ? "+" : ""}
                    {formatNumber(stockData.profile.changes)} (
                    {formatNumber((stockData.profile.changes * 100) / (stockData.profile.price - stockData.profile.changes))}%)
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-700 mb-4">
                <TabButton id="overview">Visión General</TabButton>
                <TabButton id="historical">Análisis Histórico</TabButton>
                <TabButton id="comparison">Comparativa</TabButton>
              </div>

              <div className="p-4 bg-gray-800 rounded-b-lg rounded-r-lg">
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        <Metric
                          label="Market Cap"
                          value={`$${formatNumber(stockData.profile.mktCap)}`}
                          tooltip="Total market value of a company's outstanding shares."
                        />
                        <Metric
                          label="P/E Ratio (TTM)"
                          value={formatNumber(stockData.quote?.pe ?? stockData.ratios?.priceEarningsRatioTTM)}
                          tooltip="Price-to-Earnings Ratio."
                        />
                        <Metric
                          label="P/B Ratio (TTM)"
                          value={formatNumber(stockData.metrics?.priceToBookRatioTTM ?? stockData.ratios?.priceToBookRatioTTM)}
                          tooltip="Price-to-Book Ratio."
                        />
                        <Metric
                          label="EPS (TTM)"
                          value={`$${formatNumber(stockData.quote?.eps ?? stockData.metrics?.epsTTM)}`}
                          tooltip="Earnings Per Share."
                        />
                        <Metric
                          label="Dividend Yield"
                          value={formatPercentage((stockData.metrics?.dividendYieldTTM ?? stockData.ratios?.dividendYieldTTM)! * 100)}
                          tooltip="Annual dividend yield."
                        />
                        <Metric
                          label="ROE (TTM)"
                          value={formatPercentage((stockData.metrics?.returnOnEquityTTM ?? stockData.ratios?.returnOnEquityTTM)! * 100)}
                          tooltip="Return on Equity."
                        />
                        <Metric
                          label="Debt/Equity (TTM)"
                          value={formatNumber(stockData.metrics?.debtToEquityTTM ?? stockData.ratios?.debtToEquityRatioTTM)}
                          tooltip="Debt to Equity Ratio."
                        />
                        <Metric
                          label="EPS Growth"
                          value={formatPercentage(stockData.metrics?.growthEPS! * 100)}
                          tooltip="EPS Growth Rate."
                        />
                      </div>
                    </div>
                    <div>
                      <FinancialChecklist stockData={stockData} />
                    </div>
                  </div>
                )}
                {activeTab === "historical" && <HistoricalChart data={stockData.historicalEPS} />}
                {activeTab === "comparison" && <ComparisonTable peers={stockData.peers} mainStock={stockData} />}
              </div>

              {/* Analysis & Valuation Section */}
              <div className="mt-8 border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Análisis y Valoración</h3>
                  <button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing || isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:bg-purple-800 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Analizando...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Análisis AI
                      </>
                    )}
                  </button>
                </div>

                {analysisResult && (
                  <div className="bg-purple-900/50 border border-purple-500/50 p-4 rounded-lg mb-6 animate-fade-in">
                    <h4 className="text-lg font-bold text-purple-300 mb-2">
                      Análisis de Gemini AI:
                    </h4>
                    <p className="text-gray-200 leading-relaxed">{analysisResult}</p>
                  </div>
                )}

                <DcfCalculator stockData={stockData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
