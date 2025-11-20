import { useState } from "react";
import type { StockData } from "../types/types";
import { fetchStockData as fetchStockDataService } from "../services/fmp";

export const useStockData = () => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async (symbol: string) => {
    if (!symbol) {
      setError("Please enter a stock ticker.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStockData(null);

    try {
      const data = await fetchStockDataService(symbol);
      setStockData(data);
    } catch (err: any) {
      setError(err.message);
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStockData = () => {
    setStockData(null);
    setError(null);
    setIsLoading(false);
  };

  return { stockData, isLoading, error, fetchStockData, clearStockData };
};
