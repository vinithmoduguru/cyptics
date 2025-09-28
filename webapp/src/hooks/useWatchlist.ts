import { useLocalStorage } from "react-use"
import { useCallback } from "react"

export interface WatchlistItem {
  id: string // CoinGecko ID like 'bitcoin', 'ethereum'
  symbol: string
  name: string
  addedAt: string // ISO timestamp
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useLocalStorage<WatchlistItem[]>(
    "crypto-watchlist",
    []
  )

  const addToWatchlist = useCallback(
    (crypto: { id: string; symbol: string; name: string }) => {
      const newItem: WatchlistItem = {
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        addedAt: new Date().toISOString(),
      }

      setWatchlist((prev = []) => {
        // Check if already exists
        if (prev.some((item) => item.id === crypto.id)) {
          return prev
        }
        return [...prev, newItem]
      })
    },
    [setWatchlist]
  )

  const removeFromWatchlist = useCallback(
    (cryptoId: string) => {
      setWatchlist((prev = []) => prev.filter((item) => item.id !== cryptoId))
    },
    [setWatchlist]
  )

  const isInWatchlist = useCallback(
    (cryptoId: string) => {
      return (watchlist || []).some((item) => item.id === cryptoId)
    },
    [watchlist]
  )

  const clearWatchlist = useCallback(() => {
    setWatchlist([])
  }, [setWatchlist])

  const getWatchlistIds = useCallback(() => {
    return (watchlist || []).map((item) => item.id)
  }, [watchlist])

  return {
    watchlist: watchlist || [],
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
    getWatchlistIds,
    watchlistCount: (watchlist || []).length,
  }
}
