import type {
  Cryptocurrency,
  TopCoinsResponse,
  PriceTrendResponse,
  SearchResponse,
  WatchlistResponse,
  WatchlistAddRequest,
  WatchlistOperationResponse,
  QAQueryRequest,
  QAResponse,
  SampleQueriesResponse,
} from "@/types/crypto"

const API_BASE_URL = "/api/v1/crypto"
const QA_API_BASE_URL = "/api/v1/qa"

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function apiRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)

  if (!response.ok) {
    throw new ApiError(response.status, `API Error: ${response.statusText}`)
  }

  return response.json()
}

async function apiPostRequest<T>(
  baseUrl: string,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(response.status, `API Error: ${response.statusText}`)
  }

  return response.json()
}

export const cryptoApi = {
  // Get top cryptocurrencies
  getTopCryptocurrencies: (
    limit: number = 10,
    forceRefresh: boolean = false,
    useWatchlist: boolean = true
  ): Promise<TopCoinsResponse> =>
    apiRequest(
      `/top/${limit}?force_refresh=${forceRefresh}&use_watchlist=${useWatchlist}`
    ),

  // Get specific cryptocurrency by ID
  getCryptocurrency: (
    cryptoId: string,
    forceRefresh: boolean = false
  ): Promise<Cryptocurrency> =>
    apiRequest(`/${cryptoId}?force_refresh=${forceRefresh}`),

  // Get price history/trend for a cryptocurrency
  getPriceTrend: (
    cryptoId: string,
    days: number = 30,
    forceRefresh: boolean = false
  ): Promise<PriceTrendResponse> =>
    apiRequest(
      `/${cryptoId}/price-trend?days=${days}&force_refresh=${forceRefresh}`
    ),

  // Search cryptocurrencies
  searchCryptocurrencies: (
    query: string,
    limit: number = 20
  ): Promise<SearchResponse> =>
    apiRequest(`/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  // Get watchlist
  getWatchlist: (
    skip: number = 0,
    limit: number = 10
  ): Promise<WatchlistResponse> =>
    apiRequest(`/watchlist?skip=${skip}&limit=${limit}`),

  // Add cryptocurrency to watchlist
  addToWatchlist: async (
    request: WatchlistAddRequest
  ): Promise<WatchlistOperationResponse> => {
    const response = await fetch(`${API_BASE_URL}/watchlist/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`)
    }

    return response.json()
  },

  // Remove cryptocurrency from watchlist
  removeFromWatchlist: async (
    cryptoId: string
  ): Promise<WatchlistOperationResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/watchlist/remove/${cryptoId}`,
      {
        method: "DELETE",
      }
    )

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`)
    }

    return response.json()
  },

  // Manually sync top cryptocurrencies
  syncTopCryptos: (
    limit: number = 10
  ): Promise<{ message: string; synced_count: number }> =>
    fetch(`${API_BASE_URL}/sync-top-cryptos?limit=${limit}`, {
      method: "POST",
    }).then((res) => res.json()),

  // Clean up old data
  cleanupOldData: (
    olderThanDays: number = 90
  ): Promise<{ message: string; deleted_records: number }> =>
    fetch(`${API_BASE_URL}/cleanup-old-data?older_than_days=${olderThanDays}`, {
      method: "DELETE",
    }).then((res) => res.json()),
}

// Q/A Assistant API
export const qaApi = {
  // Ask a natural language question
  askQuestion: async (query: string): Promise<QAResponse> => {
    return apiPostRequest<QAResponse>(QA_API_BASE_URL, "/ask", { query })
  },

  // Get sample queries
  getSampleQueries: async (): Promise<SampleQueriesResponse> => {
    const response = await fetch(`${QA_API_BASE_URL}/samples`)
    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`)
    }
    return response.json()
  },

  // Health check for Q/A service
  healthCheck: async (): Promise<{
    status: string
    service: string
    message: string
  }> => {
    const response = await fetch(`${QA_API_BASE_URL}/health`)
    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`)
    }
    return response.json()
  },
}
