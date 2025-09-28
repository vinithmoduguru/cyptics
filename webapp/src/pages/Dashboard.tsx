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
import { WatchlistCard } from "@/components/dashboard/WatchlistCard"
import { TopCoinsTable } from "@/components/dashboard/TopCoinsTable"
import { TopMovers } from "@/components/dashboard/TopMovers"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import QAAssistant from "@/components/QAAssistant"
import {
  RefreshCw,
  BarChart3,
  Star,
  Search,
  Flame,
  Layers,
  Sparkles,
  MessageSquare,
} from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    getWatchlistIds,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  } = useWatchlist()
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

  const topCoins = useMemo(() => top10Cryptos?.coins ?? [], [top10Cryptos])
  const watchlistDisplay = useMemo(() => {
    if (watchlistIds.length === 0) {
      return []
    }
    return watchlistCryptos ?? []
  }, [watchlistCryptos, watchlistIds])
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

  const handleRefreshWatchlist = useCallback(() => {
    refetchWatchlist()
  }, [refetchWatchlist])

  const handleAddToWatchlist = useCallback(
    (coin: { id: string; symbol: string; name: string }) => {
      addToWatchlist(coin)
      refetchWatchlist()
    },
    [addToWatchlist, refetchWatchlist]
  )

  const handleRemoveFromWatchlist = useCallback(
    (cryptoId: string) => {
      removeFromWatchlist(cryptoId)
      refetchWatchlist()
    },
    [removeFromWatchlist, refetchWatchlist]
  )

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
      const header = document.querySelector("header.sticky")
      const headerHeight =
        header instanceof HTMLElement ? header.offsetHeight : 0
      const elementTop = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementTop - headerHeight - 8, // 8px extra spacing
        behavior: "smooth",
      })
    }
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
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
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-slate-100 text-slate-600">
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
                Auto-refreshes every minute. Manual sync available from the
                header.
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
                  <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                    Cryptic Dashboard
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto">
                <Button
                  variant="outline"
                  className="hidden gap-2 rounded-full border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm md:flex"
                  onClick={() => setForceRefreshTop10((prev) => prev + 1)}
                  disabled={isLoadingTop10}>
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoadingTop10 ? "animate-spin" : ""
                    }`}
                  />
                  Refresh data
                </Button>
              </div>
            </div>
          </header>

          <main className="space-y-10 px-4 py-8 md:px-8">
            <section
              id="search-section"
              className="relative rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Search the market
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Type a currency name or ticker to jump straight to its detail
                view.
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
                  onChange={(event) =>
                    handleSearchInputChange(event.target.value)
                  }
                />
                {showSearchResults && (
                  <div className="absolute inset-x-0 top-full z-20 mt-3">
                    <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                      <Command className="w-full">
                        {isSearching ? (
                          <div className="p-5 text-center text-sm text-slate-500">
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="divide-y">
                            {searchResults.map((crypto) => (
                              <button
                                key={crypto.id}
                                type="button"
                                onClick={() =>
                                  handleSearchResultClick(crypto.id)
                                }
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
                                    <p className="font-medium text-slate-900">
                                      {crypto.name}
                                    </p>
                                    <p className="text-xs uppercase text-slate-500">
                                      {crypto.symbol}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="rounded-full bg-slate-100 text-slate-500">
                                  {crypto.market_cap_rank
                                    ? `#${crypto.market_cap_rank}`
                                    : "View"}
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
                    <h2 className="text-xl font-semibold text-slate-900">
                      My Watchlist
                    </h2>
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
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isLoadingWatchlist ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                {isLoadingWatchlist ? (
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
                ) : watchlistError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700">
                    Watchlist unavailable right now:{" "}
                    {watchlistError instanceof Error
                      ? watchlistError.message
                      : "Unable to load watchlist"}
                  </div>
                ) : emptyWatchlist ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      Build your personal watchlist
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      Pin your favorite assets to keep an eye on their latest
                      price moves and volume trends right from this dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {watchlistDisplay.map((coin) => (
                      <WatchlistCard
                        key={coin.id}
                        coin={coin}
                        isExpanded={expandedCoinId === coin.id}
                        onToggle={(coinId) =>
                          setExpandedCoinId((prev) =>
                            prev === coinId ? null : coinId
                          )
                        }
                        onOpenAsset={handleCryptoClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <TopMovers movers={movers} />
            <section
              id="top-coins-section"
              className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Top 10 cryptocurrencies
                    </h2>
                    <p className="text-sm text-slate-500">
                      Live data from CoinGecko • Auto refreshes every minute
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setForceRefreshTop10((prev) => prev + 1)}
                  disabled={isLoadingTop10}
                  className="gap-2">
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoadingTop10 ? "animate-spin" : ""
                    }`}
                  />
                  Refresh now
                </Button>
              </div>
              <div className="mt-6">
                <TopCoinsTable
                  coins={topCoins}
                  isLoading={isLoadingTop10}
                  error={top10Error}
                  onSelectCoin={handleCryptoClick}
                  isInWatchlist={isInWatchlist}
                  onAddToWatchlist={handleAddToWatchlist}
                  onRemoveFromWatchlist={handleRemoveFromWatchlist}
                />
              </div>
            </section>
          </main>
        </div>
      </div>

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
