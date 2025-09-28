export interface Cryptocurrency {
  id: string // CoinGecko ID like 'bitcoin', 'ethereum'
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation?: number
  total_volume: number
  high_24h?: number
  low_24h?: number
  price_change_24h?: number
  price_change_percentage_24h: number
  market_cap_change_24h?: number
  market_cap_change_percentage_24h?: number
  circulating_supply?: number
  total_supply?: number
  max_supply?: number
  ath?: number
  ath_change_percentage?: number
  ath_date?: string
  atl?: number
  atl_change_percentage?: number
  atl_date?: string
  last_updated: string
  image?: string
  is_active?: boolean
  is_watchlisted?: boolean
  created_at?: string
  updated_at?: string
}

export interface TopCoinsResponse {
  coins: Cryptocurrency[]
  total_count: number
}

export interface PriceTrendPoint {
  timestamp: string
  price: number
  market_cap?: number
  total_volume?: number
}

export interface PriceTrendResponse {
  crypto_id: string
  crypto_name: string
  crypto_symbol: string
  data_points: PriceTrendPoint[]
  period_days: number
}

export interface PriceHistory {
  id: number
  crypto_id: string
  price: number
  market_cap?: number
  total_volume?: number
  timestamp: string
}

// New types for watchlist functionality

export interface CryptocurrencySearch {
  id: string
  name: string
  symbol: string
  market_cap_rank?: number
  image?: string
}

export interface SearchResponse {
  results: CryptocurrencySearch[]
  total_count: number
}

export interface WatchlistResponse {
  watchlist: Cryptocurrency[]
  total_count: number
  max_capacity: number
}

export interface WatchlistAddRequest {
  crypto_id: string
  fetch_history_days?: number
}

export interface WatchlistOperationResponse {
  success: boolean
  message: string
  crypto_id: string
  watchlist_count: number
}

// Q/A Assistant types

export interface QAQueryRequest {
  query: string
}

export interface QAResponse {
  answer: string
  intent: string
  confidence: number
  entities: Record<string, unknown>
  query: string
}

export interface SampleQueriesResponse {
  samples: Record<string, string[]>
}
