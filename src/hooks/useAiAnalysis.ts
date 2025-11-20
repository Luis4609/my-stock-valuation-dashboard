import { useState } from "react";
import { fetchAiAnalysis as fetchAiAnalysisService } from "../services/gemini";
import type { StockData } from "../types/types";

export const useAiAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const analyzeStock = async (stockData: StockData) => {
    setIsAnalyzing(true);
    setAnalysisResult("");
    setError(null);

    const { profile, metrics, ratios, quote } = stockData;
    
    const formatNumber = (num: number | null | undefined): string => {
        if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return "–";
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

    const prompt = `Act as an expert financial analyst. Based on the following data for ${profile.companyName} (${profile.symbol}), provide a concise, easy-to-understand summary (in Spanish) of its financial health for a retail investor. Highlight key strengths and potential risks.

        Company Profile:
        - Industry: ${profile.industry}
        - Price: $${profile.price}
        - Market Cap: $${formatNumber(profile.mktCap)}

        Key Metrics (TTM):
        - P/E Ratio: ${formatNumber(quote?.pe ?? ratios?.priceEarningsRatioTTM)}
        - P/B Ratio: ${formatNumber(metrics?.priceToBookRatioTTM ?? ratios?.priceToBookRatioTTM)}
        - EPS: $${formatNumber(quote?.eps ?? metrics?.epsTTM)}
        - Dividend Yield: ${formatPercentage((metrics?.dividendYieldTTM ?? ratios?.dividendYieldTTM)! * 100)}
        - ROE: ${formatPercentage((metrics?.returnOnEquityTTM ?? ratios?.returnOnEquityTTM)! * 100)}
        - Debt/Equity: ${formatNumber(metrics?.debtToEquityTTM ?? ratios?.debtToEquityRatioTTM)}

        Please provide the analysis in a single, well-structured paragraph.`;

    try {
      const result = await fetchAiAnalysisService(prompt);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult("");
    setError(null);
    setIsAnalyzing(false);
  };

  return { isAnalyzing, analysisResult, error, analyzeStock, clearAnalysis };
};
