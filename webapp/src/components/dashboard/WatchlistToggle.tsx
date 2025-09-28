import type { MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

type WatchlistToggleProps = {
  isActive: boolean
  onToggle: () => void
  variant?: "icon" | "button"
  className?: string
}

export function WatchlistToggle({
  isActive,
  onToggle,
  variant = "icon",
  className,
}: WatchlistToggleProps) {
  const { toast } = useToast()
  const baseLabel = isActive ? "Remove from watchlist" : "Add to watchlist"

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onToggle()
    toast({
      title: isActive ? "Removed from watchlist" : "Added to watchlist",
      description: isActive
        ? "This cryptocurrency has been removed from your watchlist."
        : "This cryptocurrency has been added to your watchlist.",
    })
  }

  if (variant === "button") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={handleClick}
              className={cn(
                "gap-2",
                isActive ? "bg-amber-500 text-white hover:bg-amber-500/90" : "",
                className
              )}
              aria-pressed={isActive}
              aria-label={baseLabel}>
              <Star
                className="h-4 w-4"
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 0 : 1.8}
              />
              {isActive ? "In watchlist" : "Add to watchlist"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{baseLabel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={cn(
              "h-8 w-8 rounded-full text-slate-400 transition hover:text-slate-600",
              isActive ? "text-amber-500 hover:text-amber-500" : "",
              className
            )}
            aria-pressed={isActive}
            aria-label={baseLabel}>
            <Star
              className="h-4 w-4"
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={isActive ? 0 : 1.8}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{baseLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
