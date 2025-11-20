export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num))
    return "–";
  if (num > 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num > 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
};

export const formatPercentage = (num: number | null | undefined): string => {
  const formatted = formatNumber(num);
  if (formatted === "–") return "–";
  return `${formatted}%`;
};
