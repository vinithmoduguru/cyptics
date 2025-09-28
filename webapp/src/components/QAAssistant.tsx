import React, { useState, useRef, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { qaApi } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  Send,
  Lightbulb,
  Brain,
  Loader2,
  User,
  Bot,
  Sparkles,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  Info,
  AlertCircle,
} from "lucide-react"
import type { QAResponse } from "@/types/crypto"

interface QAAssistantProps {
  className?: string
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  response?: QAResponse
}

export default function QAAssistant({ className = "" }: QAAssistantProps) {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Get sample queries
  const { data: sampleQueries } = useQuery({
    queryKey: ["qa-samples"],
    queryFn: qaApi.getSampleQueries,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: qaApi.askQuestion,
    onSuccess: (response) => {
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: response.answer,
        timestamp: new Date(),
        response: response,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setQuery("")

      // Focus input after response
      setTimeout(() => inputRef.current?.focus(), 100)
    },
    onError: (error) => {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "assistant",
        content: `I'm sorry, I encountered an error: ${
          error instanceof Error
            ? error.message
            : "Failed to process your question"
        }. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setQuery("")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || askMutation.isPending) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: query.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Send to API
    askMutation.mutate(query.trim())
  }

  const handleSampleClick = (sampleQuery: string) => {
    setQuery(sampleQuery)
    setIsDialogOpen(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6)
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case "price_query":
        return <DollarSign className="h-3 w-3" />
      case "trend_query":
        return <TrendingUp className="h-3 w-3" />
      case "market_cap_query":
        return <BarChart3 className="h-3 w-3" />
      case "comparison_query":
        return <BarChart3 className="h-3 w-3" />
      case "generic_info":
        return <Info className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const clearChat = () => {
    setMessages([])
  }

  const containerClasses = [
    "flex flex-col min-h-[420px] max-h-[70vh] overflow-hidden bg-white",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white/80 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="h-8 w-8 text-blue-600" />
            <Sparkles className="h-3 w-3 text-purple-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Crypto Assistant
            </h2>
            <p className="text-sm text-gray-600">
              Ask me anything about cryptocurrencies
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-gray-500">
              Clear Chat
            </Button>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Lightbulb className="h-4 w-4 mr-1" />
                Examples
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Sample Questions</span>
                </DialogTitle>
                <DialogDescription>
                  Try these example questions to get started with the Q&A
                  Assistant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {sampleQueries?.samples &&
                  Object.entries(sampleQueries.samples).map(
                    ([category, queries]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 capitalize flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{category.replace("_", " ")}</span>
                        </h4>
                        <div className="grid gap-2 pl-4">
                          {queries.map((sampleQuery) => (
                            <Button
                              key={sampleQuery}
                              variant="ghost"
                              size="sm"
                              className="justify-start text-left h-auto p-3 whitespace-normal hover:bg-blue-50 border border-transparent hover:border-blue-200"
                              onClick={() => handleSampleClick(sampleQuery)}>
                              <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0 text-blue-500" />
                              <span className="text-sm">{sampleQuery}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50/70 p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Crypto Assistant! 👋
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              I can help you with cryptocurrency prices, trends, market caps,
              comparisons, and general information. Just ask me a question!
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="bg-white hover:bg-blue-50">
                <Lightbulb className="h-4 w-4 mr-2" />
                See Examples
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery("What is the price of Bitcoin?")}
                className="bg-white hover:bg-green-50">
                <DollarSign className="h-4 w-4 mr-2" />
                Quick Start
              </Button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}>
              <div
                className={`flex max-w-[80%] ${
                  message.type === "user" ? "flex-row-reverse" : "flex-row"
                }`}>
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 ${
                    message.type === "user" ? "ml-2" : "mr-2"
                  }`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    }`}>
                    {message.type === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1">
                  <div
                    className={`rounded-lg px-4 py-3 shadow-sm ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}>
                    <div className="text-sm whitespace-pre-line break-words">
                      {message.content}
                    </div>
                  </div>

                  {/* Metadata for assistant messages */}
                  {message.type === "assistant" && message.response && (
                    <div className="flex items-center space-x-2 mt-2 ml-2">
                      <Badge
                        variant="secondary"
                        className="text-xs flex items-center space-x-1 bg-gray-100">
                        {getIntentIcon(message.response.intent)}
                        <span>{message.response.intent.replace("_", " ")}</span>
                      </Badge>
                      <Badge
                        className={`text-xs border ${getConfidenceColor(
                          message.response.confidence
                        )}`}
                        variant="outline">
                        {Math.round(message.response.confidence * 100)}%
                        confident
                      </Badge>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  )}

                  {/* Timestamp for user messages */}
                  {message.type === "user" && (
                    <div className="flex justify-end mt-1 mr-2">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="flex-shrink-0 mr-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t bg-white px-5 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            autoFocus={true}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about crypto prices, trends, market caps, or comparisons..."
            className="flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={askMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!query.trim() || askMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6">
            {askMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
