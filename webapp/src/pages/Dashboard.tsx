import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { cryptoApi } from "@/services/api"
import { useWatchlist } from "@/hooks/useWatchlist"
import type { Cryptocurrency, CryptocurrencySearch } from "@/types/crypto"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command } from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import WatchlistManager from "@/components/WatchlistManager"
import QAAssistant from "@/components/QAAssistant"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Settings,
  BarChart3,
  Star,
  Globe,
  Search,
  LineChart,
  Flame,
  Layers,
  Sun,
  Moon,
  UserCircle2,
  Sparkles,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react"

const formatCurrency = (
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

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—"
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

type SparklineProps = {
  seed: number
  isPositive: boolean
  className?: string
}

function Sparkline({ seed, isPositive, className = "h-16 w-full" }: SparklineProps) {
  const values = useMemo(() => {
    return Array.from({ length: 16 }, (_, index) => {
      const offset = seed * 0.37 + index * 0.9
      const wave = Math.sin(offset) + Math.cos(seed * 0.15 + index * 0.6)
      const baseline = isPositive ? 0.58 : 0.42
      const amplitude = isPositive ? 0.18 : 0.14
      const normalized = baseline + wave * amplitude * 0.25
      return Math.max(0.08, Math.min(0.92, normalized))
    })
  }, [seed, isPositive])

  const gradientId = `sparkline-${seed}-${isPositive ? "up" : "down"}`

  const areaPoints = [
    "0,100",
    ...values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = (1 - value) * 100
      return `${x},${y}`
    }),
    "100,100",
  ].join(" ")

  const linePoints = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100
      const y = (1 - value) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={isPositive ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}
          />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={isPositive ? "#22c55e" : "#ef4444"}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { getWatchlistIds } = useWatchlist()
  const [isWatchlistDialogOpen, setIsWatchlistDialogOpen] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [expandedCoinId, setExpandedCoinId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CryptocurrencySearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [forceRefreshTop10, setForceRefreshTop10] = useState(0)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Query for top cryptocurrencies
  const {
    data: top10Cryptos,
    isLoading: isLoadingTop10,
    error: top10Error,
  } = useQuery({
    queryKey: ["top-cryptocurrencies", forceRefreshTop10],
    queryFn: async () => {
      // Get actual top 10 by market cap, use force refresh when button is clicked
      const shouldForceRefresh = forceRefreshTop10 > 0
      const data = await cryptoApi.getTopCryptocurrencies(
        10,
        shouldForceRefresh,
        false
      )
      return data
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // Query for watchlist - now fetches based on localStorage IDs
  const watchlistIds = getWatchlistIds()
  const {
    data: watchlistCryptos,
    isLoading: isLoadingWatchlist,
    error: watchlistError,
    refetch: refetchWatchlist,
  } = useQuery({
    queryKey: ["watchlist-cryptocurrencies", watchlistIds],
    queryFn: async () => {
      if (watchlistIds.length === 0) {
        return []
      }
      const results = await Promise.all(
        watchlistIds.map((cryptoId) => cryptoApi.getCryptocurrency(cryptoId))
      )

      const coinsById = new Map(results.map((coin) => [coin.id, coin]))
      return watchlistIds
        .map((id) => coinsById.get(id))
        .filter((coin): coin is Cryptocurrency => Boolean(coin))
    },
    enabled: watchlistIds.length > 0,
  })

  const topCoins = useMemo(
    () => top10Cryptos?.coins ?? [],
    [top10Cryptos]
  )
  const watchlistDisplay = useMemo(
    () => watchlistCryptos ?? [],
    [watchlistCryptos]
  )
  const totalWatchlist = watchlistDisplay.length || watchlistIds.length
  const emptyWatchlist = !isLoadingWatchlist && watchlistDisplay.length === 0
  const lastUpdatedDisplay = topCoins[0]?.last_updated
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(topCoins[0].last_updated))
    : "—"

  const handleCryptoClick = useCallback(
    (cryptoId: string) => {
      navigate(`/crypto/${cryptoId}`)
    },
    [navigate]
  )

  const handleWatchlistUpdate = useCallback(() => {
    setIsWatchlistDialogOpen(false)
    refetchWatchlist()
  }, [refetchWatchlist])

  const handleRefreshWatchlist = useCallback(() => {
    refetchWatchlist()
  }, [refetchWatchlist])

  const handleSearch = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await cryptoApi.searchCryptocurrencies(trimmed, 8)
      setSearchResults(response.results ?? [])
      setShowSearchResults(true)
    } catch (error) {
      console.error("Failed to search cryptocurrencies", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value)

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      const trimmed = value.trim()
      if (trimmed.length < 2) {
        setShowSearchResults(false)
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setShowSearchResults(true)
      searchTimeoutRef.current = setTimeout(() => handleSearch(trimmed), 250)
    },
    [handleSearch]
  )

  const handleSearchResultClick = useCallback(
    (cryptoId: string) => {
      navigate(`/crypto/${cryptoId}`)
      setSearchQuery("")
      setShowSearchResults(false)
      setSearchResults([])
    },
    [navigate]
  )

  const handleSidebarNavigation = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const quickStats = useMemo(() => {
    if (!topCoins.length) {
      const placeholders = [
        { name: "Bitcoin", symbol: "BTC" },
        { name: "Ethereum", symbol: "ETH" },
        { name: "Solana", symbol: "SOL" },
      ]
      return placeholders.map((placeholder, index) => ({
        key: `placeholder-${placeholder.symbol}`,
        name: placeholder.name,
        symbol: placeholder.symbol,
        price: null,
        percentage: null,
        seed: index + 1,
      }))
    }

    return topCoins.slice(0, 3).map((coin, index) => ({
      key: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      percentage: coin.price_change_percentage_24h,
      seed: coin.market_cap_rank || index,
    }))
  }, [topCoins])

  const movers = useMemo(() => {
    if (!topCoins.length) {
      return {
        gainers: [] as Cryptocurrency[],
        losers: [] as Cryptocurrency[],
        volumeLeaders: [] as Cryptocurrency[],
      }
    }

    const withChange = topCoins.filter((coin) =>
      Number.isFinite(coin.price_change_percentage_24h)
    )
    const gainers = [...withChange]
      .filter((coin) => (coin.price_change_percentage_24h ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.price_change_percentage_24h ?? 0) -
          (a.price_change_percentage_24h ?? 0)
      )
      .slice(0, 3)

    const losers = [...withChange]
      .filter((coin) => (coin.price_change_percentage_24h ?? 0) < 0)
      .sort(
        (a, b) =>
          (a.price_change_percentage_24h ?? 0) -
          (b.price_change_percentage_24h ?? 0)
      )
      .slice(0, 3)

    const volumeLeaders = [...topCoins]
      .sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0))
      .slice(0, 3)

    return { gainers, losers, volumeLeaders }
  }, [topCoins])

  const marketSummary = useMemo(() => {
    if (!topCoins.length) {
      return {
        totalMarketCap: null,
        totalVolume: null,
        btcDominance: null,
        trackedAssets: top10Cryptos?.total_count ?? 0,
      }
    }

    const totalMarketCap = topCoins.reduce(
      (sum, coin) => sum + (coin.market_cap ?? 0),
      0
    )
    const totalVolume = topCoins.reduce(
      (sum, coin) => sum + (coin.total_volume ?? 0),
      0
    )
    const btc = topCoins.find((coin) => coin.symbol.toLowerCase() === "btc")
    const btcDominance = totalMarketCap
      ? ((btc?.market_cap ?? 0) / totalMarketCap) * 100
      : null

    return {
      totalMarketCap,
      totalVolume,
      btcDominance,
      trackedAssets: top10Cryptos?.total_count ?? topCoins.length,
    }
  }, [topCoins, top10Cryptos])

  const renderTopCoinsTable = useCallback(() => {
    if (isLoadingTop10) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Coin</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`top-loading-${index}`}>
                  <TableCell>
                    <div className="h-3.5 w-8 animate-pulse rounded bg-slate-200" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-3.5 w-16 animate-pulse rounded bg-slate-200" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    if (top10Error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700">
          Could not load top cryptocurrencies: {top10Error.message}
        </div>
      )
    }

    if (!topCoins.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center text-slate-500">
          No cryptocurrency data available right now. Try refreshing shortly.
        </div>
      )
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-10">#</TableHead>
              <TableHead>Coin</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h Change</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
              <TableHead className="text-right">Volume (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCoins.map((coin) => {
              const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0
              return (
                <TableRow
                  key={coin.id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => handleCryptoClick(coin.id)}>
                  <TableCell className="font-medium">
                    {coin.market_cap_rank ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {coin.image ? (
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                          {coin.symbol.slice(0, 3).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{coin.name}</p>
                        <p className="text-xs uppercase text-slate-500">
                          {coin.symbol}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-700">
                    {formatCurrency(coin.current_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={`inline-flex items-center gap-1 border-none text-xs font-medium ${
                        isPositive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {formatPercent(coin.price_change_percentage_24h)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-700">
                    {formatCurrency(coin.market_cap, { compact: true })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-700">
                    {formatCurrency(coin.total_volume, { compact: true })}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }, [handleCryptoClick, isLoadingTop10, topCoins, top10Error])

  const renderWatchlistContent = useCallback(() => {
    if (isLoadingWatchlist) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`watchlist-loading-${index}`}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
              <div className="mt-4 h-16 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )
    }

    if (watchlistError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700">
          Watchlist unavailable right now: {watchlistError.message}
        </div>
      )
    }

    if (emptyWatchlist) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Build your personal watchlist
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Pin your favorite assets to keep an eye on their latest price moves and
            volume trends right from this dashboard.
          </p>
          <Button
            onClick={() => setIsWatchlistDialogOpen(true)}
            className="mt-6 gap-2">
            <Settings className="h-4 w-4" />
            Manage watchlist
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {watchlistDisplay.map((coin) => {
          const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0
          const isExpanded = expandedCoinId === coin.id

          return (
            <div
              key={coin.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {coin.image ? (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                      {coin.symbol.slice(0, 3).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-slate-900">{coin.name}</p>
                    <p className="text-xs uppercase text-slate-500">{coin.symbol}</p>
                  </div>
                </div>
                <Badge
                  className={`inline-flex items-center gap-1 border-none text-xs ${
                    isPositive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}>
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatPercent(coin.price_change_percentage_24h)}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Price</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(coin.current_price)}
                  </span>
                </div>
                <Sparkline
                  seed={coin.market_cap_rank ?? coin.current_price ?? 1}
                  isPositive={isPositive}
                  className="mt-3 h-20 w-full"
                />
              </div>

              {isExpanded ? (
                <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Market cap</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(coin.market_cap, { compact: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>24h volume</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(coin.total_volume, { compact: true })}
                    </span>
                  </div>
                  {coin.high_24h !== undefined && coin.low_24h !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>24h range</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(coin.low_24h)} – {formatCurrency(coin.high_24h)}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full gap-2"
                    onClick={() => handleCryptoClick(coin.id)}>
                    View details
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-slate-900"
                  onClick={() =>
                    setExpandedCoinId((prev) => (prev === coin.id ? null : coin.id))
                  }>
                  {isExpanded ? "Hide details" : "Quick view"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500 hover:text-slate-900"
                  onClick={() => handleCryptoClick(coin.id)}>
                  Open asset
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [
    emptyWatchlist,
    expandedCoinId,
    handleCryptoClick,
    isLoadingWatchlist,
    watchlistDisplay,
    watchlistError,
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="relative hidden w-64 flex-shrink-0 border-r border-white/60 bg-white/70 px-6 py-10 backdrop-blur lg:flex">
          <div className="sticky top-10 flex h-[calc(100vh-5rem)] flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Navigation
              </p>
              <nav className="mt-6 space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => handleSidebarNavigation("watchlist-section")}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-slate-100">
                  <span className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-amber-500" />
                    My Watchlist
                  </span>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                    {totalWatchlist}
                  </Badge>
                </button>
                <button
                  type="button"
                  onClick={() => handleSidebarNavigation("top-movers-section")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-slate-100">
                  <Flame className="h-4 w-4 text-rose-500" />
                  Top Movers
                </button>
                <button
                  type="button"
                  onClick={() => handleSidebarNavigation("market-overview-section")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-slate-100">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Market Overview
                </button>
                <button
                  type="button"
                  onClick={() => handleSidebarNavigation("top-coins-section")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-slate-100">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  Top Coins
                </button>
              </nav>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Last synced
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {lastUpdatedDisplay}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Auto-refreshes every minute. Manual sync available from the header.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-8 md:py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white shadow-md">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                    Your crypto command center
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                    Cryptic Dashboard
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {quickStats.map((stat) => (
                  <div
                    key={stat.key}
                    className="min-w-[120px] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm">
                    <div className="flex items-center justify-between text-xs uppercase text-slate-400">
                      <span>{stat.symbol}</span>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500">
                        Live
                      </Badge>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {formatCurrency(stat.price ?? undefined)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        stat.percentage === null
                          ? "text-slate-400"
                          : (stat.percentage ?? 0) >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}>
                      {stat.percentage === null
                        ? "Waiting for data"
                        : formatPercent(stat.percentage)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto">
                <Button variant="ghost" size="icon" className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Sun className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Moon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <UserCircle2 className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden gap-2 rounded-full border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm md:flex"
                  onClick={() => setForceRefreshTop10((prev) => prev + 1)}
                  disabled={isLoadingTop10}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingTop10 ? "animate-spin" : ""}`} />
                  Refresh data
                </Button>
              </div>
            </div>
          </header>

          <main className="space-y-10 px-4 py-8 md:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
              <div className="absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-blue-100/60 to-transparent" aria-hidden />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <Badge className="bg-slate-900 text-white">Updated {lastUpdatedDisplay}</Badge>
                  <h2 className="text-3xl font-semibold text-slate-900">
                    Track, compare, and act without leaving this page
                  </h2>
                  <p className="text-sm text-slate-500">
                    Stay on top of the market with curated insights, watchlist performance, and instant answers from your assistant.
                  </p>
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Tracked assets</span>
                    <span className="font-semibold text-slate-900">
                      {marketSummary.trackedAssets || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total market cap</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(marketSummary.totalMarketCap ?? undefined, { compact: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BTC dominance</span>
                    <span className="font-semibold text-slate-900">
                      {marketSummary.btcDominance
                        ? `${marketSummary.btcDominance.toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section id="search-section" className="relative rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Search the market</h2>
              <p className="mt-1 text-sm text-slate-500">
                Type a currency name or ticker to jump straight to its detail view.
              </p>
              <div className="relative mt-5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  value={searchQuery}
                  placeholder="Search cryptocurrencies (e.g., Bitcoin, BTC, Ethereum...)"
                  className="h-14 rounded-2xl border-2 border-transparent bg-slate-100 pl-14 text-base shadow-inner transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
                  onChange={(event) => handleSearchInputChange(event.target.value)}
                />
                {showSearchResults && (
                  <div className="absolute inset-x-0 top-full z-20 mt-3">
                    <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                      <Command className="w-full">
                        {isSearching ? (
                          <div className="p-5 text-center text-sm text-slate-500">Searching...</div>
                        ) : searchResults.length > 0 ? (
                          <div className="divide-y">
                            {searchResults.map((crypto) => (
                              <button
                                key={crypto.id}
                                type="button"
                                onClick={() => handleSearchResultClick(crypto.id)}
                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                  {crypto.image ? (
                                    <img
                                      src={crypto.image}
                                      alt={crypto.name}
                                      className="h-8 w-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                                      {crypto.symbol.slice(0, 3).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">{crypto.name}</p>
                                    <p className="text-xs uppercase text-slate-500">{crypto.symbol}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500">
                                  {crypto.market_cap_rank ? `#${crypto.market_cap_rank}` : "View"}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-6 text-sm text-slate-500">
                            No cryptocurrencies found for "{searchQuery}".
                          </div>
                        )}
                      </Command>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section
              id="watchlist-section"
              className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-white">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">My Watchlist</h2>
                    <p className="text-sm text-slate-500">
                      {totalWatchlist
                        ? `${totalWatchlist} assets • Synced locally`
                        : "No cryptocurrencies in your watchlist"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefreshWatchlist}
                    disabled={isLoadingWatchlist}
                    className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoadingWatchlist ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setIsWatchlistDialogOpen(true)}>
                    <Settings className="h-4 w-4" />
                    Manage watchlist
                  </Button>
                </div>
              </div>

              <div className="mt-6">{renderWatchlistContent()}</div>
            </section>

            <section
              id="top-movers-section"
              className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Top gainers</h3>
                  <Badge className="bg-emerald-100 text-emerald-700">24h</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {movers.gainers.length ? (
                    movers.gainers.map((coin) => (
                      <div key={coin.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">
                            {coin.symbol.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{coin.name}</p>
                            <p className="text-xs uppercase text-slate-400">
                              {coin.symbol}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-emerald-600">
                          {formatPercent(coin.price_change_percentage_24h)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Awaiting market movers…</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Top losers</h3>
                  <Badge className="bg-rose-100 text-rose-600">24h</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {movers.losers.length ? (
                    movers.losers.map((coin) => (
                      <div key={coin.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-600">
                            {coin.symbol.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{coin.name}</p>
                            <p className="text-xs uppercase text-slate-400">
                              {coin.symbol}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-rose-600">
                          {formatPercent(coin.price_change_percentage_24h)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No significant drops tracked.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Volume leaders</h3>
                  <Badge className="bg-blue-100 text-blue-600">24h</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {movers.volumeLeaders.length ? (
                    movers.volumeLeaders.map((coin) => (
                      <div key={coin.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                            {coin.symbol.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{coin.name}</p>
                            <p className="text-xs uppercase text-slate-400">
                              {coin.symbol}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(coin.total_volume, { compact: true })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Volume data on the way.</p>
                  )}
                </div>
              </div>
            </section>

            <section
              id="market-overview-section"
              className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        <LineChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Market overview</h2>
                        <p className="text-sm text-slate-500">Global market cap, BTC dominance, and total volume trends.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Market cap</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {formatCurrency(marketSummary.totalMarketCap ?? undefined, { compact: true })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">BTC dominance</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {marketSummary.btcDominance
                            ? `${marketSummary.btcDominance.toFixed(1)}%`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Volume 24h</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {formatCurrency(marketSummary.totalVolume ?? undefined, { compact: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-h-[200px] flex-1 items-end">
                    <Sparkline seed={topCoins.length || 5} isPositive className="h-40 w-full" />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Assistant tips</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                    Ask for quick comparisons ("Compare BTC vs ETH volume this week")
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    Chain follow-up questions to refine your insights.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    Save coins to the watchlist, then ask the assistant for deeper dives.
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="top-coins-section"
              className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Top 10 cryptocurrencies</h2>
                    <p className="text-sm text-slate-500">Live data from CoinGecko • Auto refreshes every minute</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setForceRefreshTop10((prev) => prev + 1)}
                  disabled={isLoadingTop10}
                  className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${isLoadingTop10 ? "animate-spin" : ""}`} />
                  Refresh now
                </Button>
              </div>
              <div className="mt-6">{renderTopCoinsTable()}</div>
            </section>
          </main>
        </div>
      </div>

      <Dialog open={isWatchlistDialogOpen} onOpenChange={setIsWatchlistDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage watchlist</DialogTitle>
            <DialogDescription>
              Add or remove cryptocurrencies. Changes sync locally to your browser.
            </DialogDescription>
          </DialogHeader>
          <WatchlistManager onWatchlistUpdate={handleWatchlistUpdate} />
        </DialogContent>
      </Dialog>

      <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
        <DialogContent className="max-w-4xl overflow-hidden border-0 bg-white p-0">
          <QAAssistant className="max-h-[80vh]" />
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl">
        <MessageSquare className="h-5 w-5" />
        Q&A Assistant
      </button>
    </div>
  )
}
