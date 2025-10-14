// --- Type Definitions ---

export interface Profile {
  image: string;
  companyName: string;
  symbol: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  price: number;
  changes: number;
  mktCap: number;
}

export interface Metrics {
  priceToBookRatioTTM?: number;
  epsTTM?: number;
  dividendYieldTTM?: number;
  returnOnEquityTTM?: number;
  debtToEquityTTM?: number;
  revenuePerShareTTM?: number;
}

export interface Ratios {
  priceEarningsRatioTTM?: number;
  priceToBookRatioTTM?: number;
  dividendYieldTTM?: number;
  returnOnEquityTTM?: number;
  debtToEquityRatioTTM?: number;
}

export interface Quote {
  pe?: number;
  eps?: number;
}

export interface HistoricalDataPoint {
    date: string;
    eps: number;
}

export interface PeerData {
    symbol: string;
    pe: number | null;
    mktCap: number | null;
}

export interface StockData {
  profile: Profile;
  metrics: Metrics;
  ratios: Ratios;
  quote: Quote;
  historicalEPS: HistoricalDataPoint[];
  peers: PeerData[];
}

export interface DcfInputs {
  epsGrowthRate: number;
  discountRate: number;
  terminalGrowthRate: number;
  targetPeRatio: number;
}

export interface ProjectionPoint {
    year: number;
    price: number;
}

export interface DcfResult {
    intrinsicValue: number;
    projections: ProjectionPoint[];
}

// --- Prop Types for Helper Components ---
export interface MetricProps {
    label: string;
    value: string | number;
    tooltip?: string;
}

export interface ErrorMessageProps {
    message: string;
}

export interface ProjectionChartProps {
    data: ProjectionPoint[];
    currentPrice: number;
}

export interface HistoricalChartProps {
    data: HistoricalDataPoint[];
}

export interface ComparisonTableProps {
    peers: PeerData[];
    mainStock: StockData;
}

export interface FinancialChecklistProps {
    stockData: StockData;
}
