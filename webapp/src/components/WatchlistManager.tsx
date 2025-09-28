import React, { useState, useEffect, useCallback, useRef } from "react"
import { Search, Plus, Trash2, Star, StarOff, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { cryptoApi } from "@/services/api"
import { useWatchlist } from "@/hooks/useWatchlist"
import type { CryptocurrencySearch, SearchResponse } from "@/types/crypto"

interface WatchlistManagerProps {
  onWatchlistUpdate?: () => void
}

const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  onWatchlistUpdate,
}) => {
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    watchlistCount,
  } = useWatchlist()

  // Memoize isInWatchlist to prevent unnecessary re-renders
  const isInWatchlist = useCallback(
    (cryptoId: string) => {
      return watchlist.some((item) => item.id === cryptoId)
    },
    [watchlist]
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CryptocurrencySearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false)
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(
    new Set()
  )
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isAddPanelOpen) {
      const timeout = window.setTimeout(() => {
        searchInputRef.current?.focus()
      }, 10)
      return () => window.clearTimeout(timeout)
    }
    return undefined
  }, [isAddPanelOpen])

  useEffect(() => {
    if (!isAddPanelOpen) {
      return
    }

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    if (searchQuery.length < 2) return

    const searchCryptocurrencies = async (query: string) => {
      try {
        setIsSearching(true)
        const response: SearchResponse = await cryptoApi.searchCryptocurrencies(
          query
        )

        // Filter out already watched cryptos
        const filteredResults = response.results.filter(
          (crypto) => !isInWatchlist(crypto.id)
        )
        setSearchResults(filteredResults)
      } catch (error) {
        console.error("Search failed:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(() => {
      searchCryptocurrencies(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isInWatchlist, isAddPanelOpen])

  const handleAddToWatchlist = async (crypto: CryptocurrencySearch) => {
    const operationId = "add-" + crypto.id

    try {
      setLoadingOperations((prev) => new Set(prev).add(operationId))

      addToWatchlist({
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
      })

      setSearchResults((prev) => {
        const next = prev.filter((c) => c.id !== crypto.id)
        if (next.length === 0) {
          setSearchQuery("")
        }
        return next
      })
      onWatchlistUpdate?.()
    } catch (error) {
      console.error("Failed to add to watchlist:", error)
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev)
        newSet.delete(operationId)
        return newSet
      })
    }
  }

  const handleRemoveFromWatchlist = async (cryptoId: string) => {
    const operationId = "remove-" + cryptoId

    try {
      setLoadingOperations((prev) => new Set(prev).add(operationId))
      removeFromWatchlist(cryptoId)
      onWatchlistUpdate?.()
    } catch (error) {
      console.error("Failed to remove from watchlist:", error)
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev)
        newSet.delete(operationId)
        return newSet
      })
    }
  }

  const handleClearWatchlist = async () => {
    try {
      setLoadingOperations((prev) => new Set(prev).add("clear-all"))
      clearWatchlist()
      onWatchlistUpdate?.()
    } catch (error) {
      console.error("Failed to clear watchlist:", error)
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev)
        newSet.delete("clear-all")
        return newSet
      })
    }
  }

  const handleToggleAddPanel = () => {
    setIsAddPanelOpen((prev) => {
      const next = !prev
      if (!next) {
        setSearchQuery("")
        setSearchResults([])
        setIsSearching(false)
      }
      return next
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Watchlist ({watchlistCount})
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAddPanel}
            className="gap-2">
            {isAddPanelOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isAddPanelOpen ? "Close" : "Add"}
          </Button>

          {watchlistCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearWatchlist}
              disabled={loadingOperations.has("clear-all")}>
              {loadingOperations.has("clear-all") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddPanelOpen && (
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b p-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Add cryptocurrencies
                </h3>
                <p className="text-xs text-slate-500">
                  Search for assets and add them directly to your watchlist.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleAddPanel}
                className="text-slate-500 hover:text-slate-900">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 p-4">
              <Command className="rounded-lg border shadow-inner">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search cryptocurrencies..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto border-t bg-white/80">
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : !searchQuery ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      Start typing to find a cryptocurrency
                    </div>
                  ) : searchQuery.length < 2 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      Enter at least 2 characters to search
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      No cryptocurrencies found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {searchResults.map((crypto) => (
                        <div
                          key={crypto.id}
                          className="flex items-center justify-between rounded-md p-3 transition hover:bg-slate-50">
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
                              <p className="text-sm font-medium text-slate-900">
                                {crypto.name}
                              </p>
                              <p className="text-xs uppercase text-slate-500">
                                {crypto.symbol}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToWatchlist(crypto)}
                            disabled={loadingOperations.has("add-" + crypto.id)}
                            className="h-8 px-3">
                            {loadingOperations.has("add-" + crypto.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Command>
            </div>
          </div>
        )}

        {watchlistCount === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No cryptocurrencies in your watchlist</p>
            <p className="text-sm">Click "Add" to start watching</p>
          </div>
        ) : (
          watchlist.map((crypto) => (
            <div
              key={crypto.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="font-medium">{crypto.name}</div>
                  <div className="text-sm text-gray-500 uppercase">
                    {crypto.symbol}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Added {new Date(crypto.addedAt).toLocaleDateString()}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromWatchlist(crypto.id)}
                  disabled={loadingOperations.has("remove-" + crypto.id)}>
                  {loadingOperations.has("remove-" + crypto.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default WatchlistManager
