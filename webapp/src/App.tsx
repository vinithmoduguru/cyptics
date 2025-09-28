import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import Dashboard from "./pages/Dashboard"
import CryptoDetail from "./pages/CryptoDetail"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crypto/:cryptoId" element={<CryptoDetail />} />
          </Routes>
        </div>
      </Router>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
