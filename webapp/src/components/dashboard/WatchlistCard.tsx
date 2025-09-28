import type { Cryptocurrency } from "@/types/crypto"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercent } from "@/lib/format"
import { Sparkline } from "./Sparkline"
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"

type WatchlistCardProps = {
  coin: Cryptocurrency
  isExpanded: boolean
  onToggle: (coinId: string) => void
  onOpenAsset: (coinId: string) => void
}

export function WatchlistCard({
  coin,
  isExpanded,
  onToggle,
  onOpenAsset,
}: WatchlistCardProps) {
  const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
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
            <p className="text-base font-semibold text-slate-900">
              {coin.name}
            </p>
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
            onClick={() => onOpenAsset(coin.id)}>
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
          onClick={() => onToggle(coin.id)}>
          {isExpanded ? "Hide details" : "Quick view"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-slate-900"
          onClick={() => onOpenAsset(coin.id)}>
          Open asset
        </Button>
      </div>
    </div>
  )
}
