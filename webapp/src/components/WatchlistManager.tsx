import React, { useState, useEffect, useCallback } from "react"
import { Search, Plus, Trash2, Star, StarOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(
    new Set()
  )

  useEffect(() => {
    if (onWatchlistUpdate) {
      onWatchlistUpdate()
    }
  }, [watchlist, onWatchlistUpdate])

  useEffect(() => {
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
  }, [searchQuery, isInWatchlist]) // Include memoized isInWatchlist

  const handleAddToWatchlist = async (crypto: CryptocurrencySearch) => {
    const operationId = "add-" + crypto.id

    try {
      setLoadingOperations((prev) => new Set(prev).add(operationId))

      addToWatchlist({
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
      })

      setSearchResults((prev) => prev.filter((c) => c.id !== crypto.id))

      if (searchResults.length <= 1) {
        setSearchQuery("")
        setIsDialogOpen(false)
      }
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

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Watchlist ({watchlistCount})
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Cryptocurrency</DialogTitle>
                <DialogDescription>
                  Search and add cryptocurrencies to your watchlist
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <Command className="rounded-lg border shadow-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search cryptocurrencies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-0 focus:ring-0 shadow-none"
                    />
                  </div>

                  <div className="max-h-80 overflow-y-auto border-t">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </div>
                      </div>
                    ) : searchResults.length === 0 && searchQuery ? (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No cryptocurrencies found</p>
                        <p className="text-xs mt-1">
                          Try a different search term
                        </p>
                      </div>
                    ) : searchQuery.length < 2 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start typing to search</p>
                        <p className="text-xs mt-1">
                          Enter at least 2 characters
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {searchResults.map((crypto) => (
                          <div
                            key={crypto.id}
                            className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              {crypto.image && (
                                <img
                                  src={crypto.image}
                                  alt={crypto.name}
                                  className="w-8 h-8 rounded-full"
                                  loading="lazy"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {crypto.name}
                                </div>
                                <div className="text-xs text-gray-500 uppercase font-mono">
                                  {crypto.symbol}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToWatchlist(crypto)}
                              disabled={loadingOperations.has(
                                "add-" + crypto.id
                              )}
                              className="h-8 w-8 p-0">
                              {loadingOperations.has("add-" + crypto.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Command>
              </div>
            </DialogContent>
          </Dialog>

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
      <CardContent className="space-y-2">
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
