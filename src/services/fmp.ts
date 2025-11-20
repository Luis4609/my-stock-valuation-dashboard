import type { StockData, PeerData } from "../types/types";

const API_KEY = import.meta.env.VITE_FMP_API_KEY as string;

export const fetchStockData = async (symbol: string): Promise<StockData> => {
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
    `https://financialmodelingprep.com/stable/income-statement-growth?symbol=${upperTicker}&apikey=${API_KEY}`,
  ];

  const responses = await Promise.all(urls.map((url) => fetch(url)));
  if (responses.some((res) => !res.ok))
    throw new Error("Failed to fetch some stock data.");

  const [metricsData, ratiosData, quoteData, historicalData, growthData] = await Promise.all(responses.map((res) => res.json()));

  const peers: PeerData[] = [];

  const rawProfile = profileData[0];
  const rawMetrics = metricsData.length > 0 ? metricsData[0] : {};
  const rawRatios = ratiosData.length > 0 ? ratiosData[0] : {};
  const rawQuote = quoteData.length > 0 ? quoteData[0] : {};
  const rawHistoricalData = historicalData.length > 0 ? historicalData[0] : {};
  const rawGrowthData = growthData && growthData.length > 0 ? growthData[0] : {};

  const combinedData: StockData = {
    profile: {
      ...rawProfile,
      mktCap: rawProfile.mktCap || rawProfile.marketCap || 0,
    },
    metrics: {
      ...rawMetrics,
      epsTTM: rawMetrics.epsTTM || rawMetrics.netIncomePerShareTTM || rawHistoricalData.eps || undefined,
      revenuePerShareTTM: rawMetrics.revenuePerShareTTM || rawMetrics.revenuePerShare || undefined,
      growthEPS: rawGrowthData.growthEPS || undefined,
    },
    ratios: {
      ...rawRatios,
      priceEarningsRatioTTM: rawRatios.priceEarningsRatioTTM || rawRatios.peRatioTTM || rawRatios.priceToEarningsRatioTTM || undefined,
    },
    quote: {
      ...rawQuote,
      pe: rawQuote.pe || rawQuote.priceEarnings || undefined,
      eps: rawHistoricalData.eps || undefined,
    },
    historicalEPS: historicalData.map((d: any) => ({
      date: d.date,
      eps: d.eps,
    })),
    peers: peers,
  };

  console.log("Transformed StockData:", combinedData);
  return combinedData;
};
