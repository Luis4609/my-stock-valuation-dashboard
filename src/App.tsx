import React, { useState, useEffect } from "react";
import type {
  DcfInputs,
  DcfResult,
  PeerData,
  StockData,
} from "./types/types";
import { Metric } from "./components/Metric";
import { Spinner } from "./components/Spinner";
import { ErrorMessage } from "./components/ErrorMessage";
import { ProjectionChart } from "./components/ProjectionChart";
import { HistoricalChart } from "./components/HistoricalChart";
import { ComparisonTable } from "./components/ComparisonTable";
import { FinancialChecklist } from "./components/FinancialChecklist";
import { Watchlist } from "./components/Watchlist";

const API_KEY = import.meta.env.VITE_FMP_API_KEY as string;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// Main Application Component
const App: React.FC = () => {
  const [ticker, setTicker] = useState<string>("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dcfInputs, setDcfInputs] = useState<DcfInputs>({
    epsGrowthRate: 10,
    discountRate: 8,
    terminalGrowthRate: 2,
    targetPeRatio: 20,
  });
  const [dcfResult, setDcfResult] = useState<DcfResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");

  const fetchStockData = async (symbol: string = ticker): Promise<void> => {
    if (!symbol) {
      setError("Please enter a stock ticker.");
      return;
    }


    setIsLoading(true);
    setError(null);
    setStockData(null);
    setAnalysisResult("");

    try {
      const upperTicker = symbol.toUpperCase();
      const profileUrl = `https://financialmodelingprep.com/stable/profile?symbol=${upperTicker}&apikey=${API_KEY}`;
      const profileResponse = await fetch(profileUrl);
      if (!profileResponse.ok)
        throw new Error("Could not fetch profile data. Check ticker.");
      const profileData = await profileResponse.json();
      if (profileData.length === 0)
        throw new Error(`No data found for ticker "${upperTicker}".`);



      const urls = [
        `https://financialmodelingprep.com/stable/key-metrics-ttm?symbol=${upperTicker}&apikey=${API_KEY}`,
        `https://financialmodelingprep.com/stable/ratios-ttm?symbol=${upperTicker}&apikey=${API_KEY}`,
        `https://financialmodelingprep.com/stable/quote?symbol=${upperTicker}&apikey=${API_KEY}`,
        `https://financialmodelingprep.com/stable/income-statement?symbol=${upperTicker}&limit=5&apikey=${API_KEY}`,

      ];

      const responses = await Promise.all(urls.map((url) => fetch(url)));
      if (responses.some((res) => !res.ok))
        throw new Error("Failed to fetch some stock data.");

      const [metricsData, ratiosData, quoteData, historicalData] =
        await Promise.all(responses.map((res) => res.json()));

      const peers: PeerData[] = [];

      const rawProfile = profileData[0];
      const rawMetrics = metricsData.length > 0 ? metricsData[0] : {};
      const rawRatios = ratiosData.length > 0 ? ratiosData[0] : {};
      const rawQuote = quoteData.length > 0 ? quoteData[0] : {};

      const combinedData: StockData = {
        profile: {
          ...rawProfile,
          mktCap: rawProfile.mktCap || rawProfile.marketCap || 0,
        },
        metrics: rawMetrics,
        ratios: rawRatios,
        quote: rawQuote,
        historicalEPS: historicalData.map((d: any) => ({
          date: d.date,
          eps: d.eps,
        })),
        peers: peers,
      };
      setStockData(combinedData);

      if (combinedData.quote?.pe) {
        setDcfInputs((prev) => ({
          ...prev,
          targetPeRatio: parseFloat(combinedData.quote.pe!.toFixed(2)),
        }));
      }
    } catch (err: any) {
      setError(err.message);
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num) || !isFinite(num))
      return "–";
    if (num > 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num > 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPercentage = (num: number | null | undefined): string => {
    const formatted = formatNumber(num);
    if (formatted === "–") return "–";
    return `${formatted}%`;
  };

  const handleAiAnalysis = async (): Promise<void> => {
    if (!stockData) return;
    setIsAnalyzing(true);
    setAnalysisResult("");
    setError(null);

    const { profile, metrics, ratios, quote } = stockData;
    const prompt = `Act as an expert financial analyst. Based on the following data for ${
      profile.companyName
    } (${
      profile.symbol
    }), provide a concise, easy-to-understand summary (in Spanish) of its financial health for a retail investor. Highlight key strengths and potential risks.

        Company Profile:
        - Industry: ${profile.industry}
        - Price: $${profile.price}
        - Market Cap: $${formatNumber(profile.mktCap)}

        Key Metrics (TTM):
        - P/E Ratio: ${formatNumber(quote?.pe ?? ratios?.priceEarningsRatioTTM)}
        - P/B Ratio: ${formatNumber(
          metrics?.priceToBookRatioTTM ?? ratios?.priceToBookRatioTTM
        )}
        - EPS: $${formatNumber(quote?.eps ?? metrics?.epsTTM)}
        - Dividend Yield: ${formatPercentage(
          (metrics?.dividendYieldTTM ?? ratios?.dividendYieldTTM)! * 100
        )}
        - ROE: ${formatPercentage(
          (metrics?.returnOnEquityTTM ?? ratios?.returnOnEquityTTM)! * 100
        )}
        - Debt/Equity: ${formatNumber(
          metrics?.debtToEquityTTM ?? ratios?.debtToEquityRatioTTM
        )}

        Please provide the analysis in a single, well-structured paragraph.`;

    try {
      const geminiApiKey = GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok)
        throw new Error(
          "Failed to get analysis from AI. The model may be overloaded."
        );
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) setAnalysisResult(text);
      else throw new Error("No analysis content received from AI.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const { epsGrowthRate, discountRate, terminalGrowthRate } = dcfInputs;
    if (stockData && stockData.quote?.eps) {
      let futureEps: number[] = [stockData.quote.eps];
      for (let i = 1; i <= 5; i++)
        futureEps.push(futureEps[i - 1] * (1 + epsGrowthRate / 100));
      const discountedEps = futureEps
        .slice(1)
        .map((eps, i) => eps / Math.pow(1 + discountRate / 100, i + 1));
      const terminalValue =
        (futureEps[5] * (1 + terminalGrowthRate / 100)) /
        (discountRate / 100 - terminalGrowthRate / 100);
      const discountedTerminalValue =
        terminalValue / Math.pow(1 + discountRate / 100, 5);
      const intrinsicValue =
        discountedEps.reduce((a, b) => a + b, 0) + discountedTerminalValue;
      const currentYear = new Date().getFullYear();
      const projections = futureEps
        .slice(1)
        .map((eps, i) => ({
          year: currentYear + i + 1,
          price: eps * dcfInputs.targetPeRatio,
        }));
      setDcfResult({ intrinsicValue, projections });
    } else {
      setDcfResult(null);
    }
  }, [stockData, dcfInputs]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    fetchStockData();
  };
  const handleClear = (): void => {
    setTicker("");
    setStockData(null);
    setError(null);
    setIsLoading(false);
    setAnalysisResult("");
  };
  const handleDcfInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setDcfInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  const getValuationColor = (peRatio: number | undefined | null): string => {
    const pe = peRatio ?? stockData?.ratios?.priceEarningsRatioTTM;
    if (pe === null || pe === undefined || pe <= 0) return "border-gray-600";
    if (pe < 15) return "border-green-500";
    if (pe >= 15 && pe <= 25) return "border-yellow-500";
    return "border-red-500";
  };
  const getDcfValuation = (): { text: string; color: string } => {
    if (!dcfResult || !stockData) return { text: "", color: "text-white" };
    const difference =
      ((dcfResult.intrinsicValue - stockData.profile.price) /
        stockData.profile.price) *
      100;
    if (difference > 10)
      return {
        text: `Potencialmente infravalorada en un ${difference.toFixed(2)}%`,
        color: "text-green-400",
      };
    if (difference < -10)
      return {
        text: `Potencialmente sobrevalorada en un ${Math.abs(
          difference
        ).toFixed(2)}%`,
        color: "text-red-400",
      };
    return { text: "Valoración justa", color: "text-yellow-400" };
  };

  const TabButton = ({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-t-lg font-semibold ${
        activeTab === id
          ? "bg-gray-800 text-white"
          : "bg-gray-700 text-gray-400"
      }`}
    >
      {children}
    </button>
  );

  const handleWatchlistSelect = (symbol: string) => {
    setTicker(symbol);
    fetchStockData(symbol);
  };

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
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input
              type="text"
              value={ticker}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTicker(e.target.value)
              }
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

          {stockData && (
            <div
              className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border-l-4"
              style={{
                borderColor: getValuationColor(stockData.quote?.pe).split(
                  "-"
                )[1],
              }}
            >
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
                    {stockData.profile.exchangeShortName} |{" "}
                    {stockData.profile.industry}
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
                  <p
                    className={`text-4xl font-bold ${
                      stockData.profile.changes > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    ${formatNumber(stockData.profile.price)}
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      stockData.profile.changes > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stockData.profile.changes > 0 ? "+" : ""}
                    {formatNumber(stockData.profile.changes)} (
                    {formatNumber(
                      (stockData.profile.changes * 100) /
                        (stockData.profile.price - stockData.profile.changes)
                    )}
                    %)
                  </p>
                </div>
              </div>

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
                          value={formatNumber(
                            stockData.quote?.pe ??
                              stockData.ratios?.priceEarningsRatioTTM
                          )}
                          tooltip="Price-to-Earnings Ratio. A high P/E could mean a stock's price is high relative to earnings and possibly overvalued."
                        />
                        <Metric
                          label="P/B Ratio (TTM)"
                          value={formatNumber(
                            stockData.metrics?.priceToBookRatioTTM ??
                              stockData.ratios?.priceToBookRatioTTM
                          )}
                          tooltip="Price-to-Book Ratio. Compares a company's market capitalization to its book value."
                        />
                        <Metric
                          label="EPS (TTM)"
                          value={`$${formatNumber(
                            stockData.quote?.eps ?? stockData.metrics?.epsTTM
                          )}`}
                          tooltip="Earnings Per Share. The portion of a company's profit allocated to each outstanding share."
                        />
                        <Metric
                          label="Dividend Yield"
                          value={formatPercentage(
                            (stockData.metrics?.dividendYieldTTM ??
                              stockData.ratios?.dividendYieldTTM)! * 100
                          )}
                          tooltip="The ratio of a company's annual dividend compared to its share price."
                        />
                        <Metric
                          label="ROE (TTM)"
                          value={formatPercentage(
                            (stockData.metrics?.returnOnEquityTTM ??
                              stockData.ratios?.returnOnEquityTTM)! * 100
                          )}
                          tooltip="Return on Equity. Measures a corporation's profitability in relation to stockholders’ equity."
                        />
                        <Metric
                          label="Debt/Equity (TTM)"
                          value={formatNumber(
                            stockData.metrics?.debtToEquityTTM ??
                              stockData.ratios?.debtToEquityRatioTTM
                          )}
                          tooltip="Measures a company's financial leverage."
                        />
                        <Metric
                          label="Revenue per Share"
                          value={`$${formatNumber(
                            stockData.metrics?.revenuePerShareTTM
                          )}`}
                          tooltip="A company's total revenue divided by its number of shares outstanding."
                        />
                      </div>
                    </div>
                    <div>
                      <FinancialChecklist stockData={stockData} />
                    </div>
                  </div>
                )}
                {activeTab === "historical" && (
                  <HistoricalChart data={stockData.historicalEPS} />
                )}
                {activeTab === "comparison" && (
                  <ComparisonTable
                    peers={stockData.peers}
                    mainStock={stockData}
                  />
                )}
              </div>

              <div className="mt-8 border-t border-gray-700 pt-6">
                <div className="flex justify-center items-center gap-4 mb-4">
                  <h3 className="text-2xl font-bold">
                    Calculadora de Flujo de Caja Descontado (DCF)
                  </h3>
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
                    <p className="text-gray-200 leading-relaxed">
                      {analysisResult}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">Parámetros</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Tasa de Crecimiento EPS (%)
                        </label>
                        <input
                          type="number"
                          name="epsGrowthRate"
                          value={dcfInputs.epsGrowthRate}
                          onChange={handleDcfInputChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Tasa de Descuento (%)
                        </label>
                        <input
                          type="number"
                          name="discountRate"
                          value={dcfInputs.discountRate}
                          onChange={handleDcfInputChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Tasa de Crecimiento Terminal (%)
                        </label>
                        <input
                          type="number"
                          name="terminalGrowthRate"
                          value={dcfInputs.terminalGrowthRate}
                          onChange={handleDcfInputChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          P/E Ratio Objetivo
                        </label>
                        <input
                          type="number"
                          name="targetPeRatio"
                          value={dcfInputs.targetPeRatio}
                          onChange={handleDcfInputChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-center items-center">
                    <h4 className="text-lg font-semibold mb-4">
                      Valor Intrínseco Estimado
                    </h4>
                    {dcfResult ? (
                      <>
                        <div className="text-5xl font-bold text-blue-400 mb-2">
                          ${dcfResult.intrinsicValue.toFixed(2)}
                        </div>
                        <div className={`text-xl ${getDcfValuation().color}`}>
                          {getDcfValuation().text}
                        </div>
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          Basado en los parámetros ingresados y el modelo DCF.
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">
                        Ingrese datos para calcular.
                      </p>
                    )}
                  </div>
                </div>

                {dcfResult && (
                  <ProjectionChart
                    data={dcfResult.projections}
                    currentPrice={stockData.profile.price}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
