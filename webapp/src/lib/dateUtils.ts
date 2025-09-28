/**
 * Format date as relative time (e.g., "10s ago", "5 min ago", "2h ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  )

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}d ago`
  }

  // For dates older than 30 days, show the actual date
  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffInDays > 365 ? "numeric" : undefined,
  })
}

/**
 * Format date for charts (e.g., "Sep 5", "Dec 25")
 */
export const formatChartDate = (date: string | Date): string => {
  const targetDate = new Date(date)
  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with year for tooltips (e.g., "Sep 5, 2025")
 */
export const formatTooltipDate = (date: string | Date): string => {
  const targetDate = new Date(date)
  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
