import type { Cryptocurrency } from "@/types/crypto"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPercent } from "@/lib/format"

export type Movers = {
  gainers: Cryptocurrency[]
  losers: Cryptocurrency[]
  volumeLeaders: Cryptocurrency[]
}

type TopMoversProps = {
  movers: Movers
}

export function TopMovers({ movers }: TopMoversProps) {
  return (
    <section id="top-movers-section" className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Top gainers</h3>
          <Badge className="bg-emerald-100 text-emerald-700">24h</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {movers.gainers.length ? (
            movers.gainers.map((coin) => (
              <div
                key={coin.id}
                className="flex items-center justify-between text-sm">
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
              <div
                key={coin.id}
                className="flex items-center justify-between text-sm">
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
            <p className="text-sm text-slate-500">
              No significant drops tracked.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Volume leaders
          </h3>
          <Badge className="bg-blue-100 text-blue-600">24h</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {movers.volumeLeaders.length ? (
            movers.volumeLeaders.map((coin) => (
              <div
                key={coin.id}
                className="flex items-center justify-between text-sm">
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
  )
}
