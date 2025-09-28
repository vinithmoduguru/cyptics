export const formatCurrency = (
  value?: number,
  options: { compact?: boolean } = {}
) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—"
  }

  const maximumFractionDigits = options.compact
    ? 2
    : value < 1
    ? 4
    : value < 1000
    ? 2
    : 0

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits,
  }).format(value)
}

export const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—"
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}
