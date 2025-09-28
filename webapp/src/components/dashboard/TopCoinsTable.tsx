import type { Cryptocurrency } from "@/types/crypto"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/format"
import { WatchlistToggle } from "./WatchlistToggle"

const skeletonRows = Array.from({ length: 6 })

type WatchlistCandidate = Pick<Cryptocurrency, "id" | "symbol" | "name">

type TopCoinsTableProps = {
  coins: Cryptocurrency[]
  isLoading: boolean
  error: unknown
  onSelectCoin: (coinId: string) => void
  isInWatchlist: (coinId: string) => boolean
  onAddToWatchlist: (coin: WatchlistCandidate) => void
  onRemoveFromWatchlist: (coinId: string) => void
}

export function TopCoinsTable({
  coins,
  isLoading,
  error,
  onSelectCoin,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
}: TopCoinsTableProps) {
  if (isLoading) {
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
            {skeletonRows.map((_, index) => (
              <TableRow key={`top-loading-${index}`}>
                <TableCell>
                  <div className="h-3.5 w-8 animate-pulse rounded bg-slate-200" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
                      </div>
                    </div>
                    <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-slate-200" />
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

  if (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700">
        Could not load top cryptocurrencies: {message}
      </div>
    )
  }

  if (!coins.length) {
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
          {coins.map((coin) => {
            const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0
            const inWatchlist = isInWatchlist(coin.id)
            const handleToggleWatchlist = () => {
              if (inWatchlist) {
                onRemoveFromWatchlist(coin.id)
              } else {
                onAddToWatchlist({
                  id: coin.id,
                  symbol: coin.symbol,
                  name: coin.name,
                })
              }
            }
            return (
              <TableRow
                key={coin.id}
                className="cursor-pointer transition hover:bg-slate-50"
                onClick={() => onSelectCoin(coin.id)}>
                <TableCell className="font-medium">
                  {coin.market_cap_rank ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-between gap-3">
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
                        <p className="font-medium text-slate-900">
                          {coin.name}
                        </p>
                        <p className="text-xs uppercase text-slate-500">
                          {coin.symbol}
                        </p>
                      </div>
                    </div>
                    <WatchlistToggle
                      isActive={inWatchlist}
                      onToggle={handleToggleWatchlist}
                    />
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
}
