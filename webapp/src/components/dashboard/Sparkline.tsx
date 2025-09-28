import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

type SparklineProps = {
  seed: number
  isPositive: boolean
  className?: string
}

export function Sparkline({
  seed,
  isPositive,
  className = "h-16 w-full",
}: SparklineProps) {
  const data = useMemo(() => {
    return Array.from({ length: 16 }, (_, index) => {
      const offset = seed * 0.37 + index * 0.9
      const wave = Math.sin(offset) + Math.cos(seed * 0.15 + index * 0.6)
      const baseline = isPositive ? 0.58 : 0.42
      const amplitude = isPositive ? 0.18 : 0.14
      const normalized = baseline + wave * amplitude * 0.25
      return {
        index,
        value: Math.max(0.08, Math.min(0.92, normalized)),
      }
    })
  }, [seed, isPositive])

  const gradientId = `sparkline-${seed}-${isPositive ? "up" : "down"}`
  const strokeColor = isPositive ? "#22c55e" : "#ef4444"
  const fillColor = isPositive ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"

  return (
    <div className={cn("relative", className)} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2.4}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
