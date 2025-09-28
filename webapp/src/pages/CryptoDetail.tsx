import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { cryptoApi } from "@/services/api"
import { formatChartDate, formatTooltipDate } from "@/lib/dateUtils"
import { useWatchlist } from "@/hooks/useWatchlist"
import { WatchlistToggle } from "@/components/dashboard/WatchlistToggle"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { TooltipProps } from "recharts"
import { useState, useEffect } from "react"

interface PriceTrendData {
  date: string
  price: number
  formatted_date: string
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PriceTrendData
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Date
            </span>
            <span className="font-bold text-muted-foreground">
              {data.formatted_date}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Price
            </span>
            <span className="font-bold">
              ${Number(payload[0].value).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function CryptoDetail() {
  const { cryptoId } = useParams<{ cryptoId: string }>()
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()

  // Fetch live crypto data every 30 seconds
  const {
    data: crypto,
    isLoading: cryptoLoading,
    refetch: refetchCrypto,
  } = useQuery({
    queryKey: ["cryptocurrency", cryptoId],
    queryFn: () => cryptoApi.getCryptocurrency(cryptoId!, false),
    refetchInterval: 30000, // 30 seconds
    enabled: !!cryptoId,
  })

  // Fetch historical price data for chart
  const { data: priceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["price-history", cryptoId],
    queryFn: () => cryptoApi.getPriceTrend(cryptoId!, 30),
    enabled: !!cryptoId,
  })

  // Update timestamp when data refreshes
  useEffect(() => {
    if (crypto) {
      setLastUpdate(new Date())
    }
  }, [crypto])

  // Handle back navigation
  const handleBack = () => {
    navigate("/")
  }

  // Handle manual refresh
  const handleRefresh = () => {
    refetchCrypto()
    setLastUpdate(new Date())
  }

  // Format price history data for chart
  const chartData: PriceTrendData[] =
    priceHistory?.data_points?.map(
      (item: { timestamp: string; price: number }) => ({
        date: item.timestamp,
        price: item.price,
        formatted_date: formatTooltipDate(item.timestamp),
      })
    ) || []

  const inWatchlist = crypto ? isInWatchlist(crypto.id) : false

  const handleToggleWatchlist = () => {
    if (!crypto) return

    if (inWatchlist) {
      removeFromWatchlist(crypto.id)
    } else {
      addToWatchlist({
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
      })
    }
  }

  if (cryptoLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32"></div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (!crypto) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Cryptocurrency not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPositiveChange = (crypto?.price_change_24h ?? 0) >= 0

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant="secondary" className="text-xs">
            Live • Updates every 30s
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <WatchlistToggle
            variant="button"
            isActive={inWatchlist}
            onToggle={handleToggleWatchlist}
            className="whitespace-nowrap"
          />
        </div>
      </div>

      {/* Live Price Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {crypto.image && (
                <img
                  src={crypto.image}
                  alt={crypto.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <CardTitle className="text-2xl">{crypto.name}</CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground uppercase">
                  {crypto.symbol}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                ${crypto.current_price.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 justify-end mt-1">
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <Badge
                  variant={isPositiveChange ? "default" : "destructive"}
                  className="text-xs">
                  {isPositiveChange ? "+" : ""}
                  {(crypto.price_change_24h ?? 0).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Market Cap</p>
              <p className="font-semibold">
                ${crypto.market_cap.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">24h Volume</p>
              <p className="font-semibold">
                ${crypto.total_volume.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Market Cap Rank</p>
              <p className="font-semibold">#{crypto.market_cap_rank}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-semibold text-xs">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Price Trend (30 Days)
            <Badge variant="outline" className="text-xs">
              Historical Data
            </Badge>
          </CardTitle>
          <CardDescription>
            Price movement over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    interval="preserveStartEnd"
                    minTickGap={50}
                    tickFormatter={(value: string) => formatChartDate(value)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(value: number) =>
                      `$${value.toLocaleString()}`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">
                No historical data available
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
