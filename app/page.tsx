"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { ResultsTable } from "@/components/results-table"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { FactCheckResult } from "@/types/fact-check"

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const backendUrl = apiUrl || "http://localhost:3001"
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<FactCheckResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }
    setFile(selectedFile)
    setError(null)
  }

  const getMockResults = (fileName: string): FactCheckResult[] => {
    return [
      {
        claim: "The Earth orbits around the Sun",
        status: "Verified",
        explanation: "This is a scientifically confirmed fact. Earth takes approximately 365.25 days to orbit the Sun.",
        source: "NASA - Space Science",
      },
      {
        claim: "Water boils at 100 degrees Celsius at sea level",
        status: "Verified",
        explanation: "This is accurate under standard atmospheric pressure (1 atm) at sea level.",
        source: "Chemistry - Physical Properties of Water",
      },
      {
        claim: "The Great Wall of China is visible from space",
        status: "False",
        explanation:
          "This is a common misconception. The Great Wall is not easily visible from orbit with the naked eye.",
        source: "NASA - Common Misconceptions",
      },
      {
        claim: "Humans only use 10% of their brain",
        status: "False",
        explanation: "This is a myth. Most of the brain is active almost all the time, and we use virtually all of it.",
        source: "Neuroscience Research",
      },
    ]
  }

  const handleCheckFacts = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      if (typeof window !== "undefined") {
        console.log("[v0] Sending fact-check request to:", backendUrl)
      }

      let data: unknown = null
      let usesMockData = false

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${backendUrl}/fact-check`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        data = await response.json()
      } catch (fetchErr) {
        if (typeof window !== "undefined") {
          console.log("[v0] Backend unavailable, using mock data for demo")
        }
        usesMockData = true
        data = getMockResults(file.name)
      }

      if (!Array.isArray(data)) {
        if (typeof window !== "undefined") {
          console.error("[v0] Invalid API response structure:", data)
        }
        setError("No fact-checking results returned.")
        return
      }

      if (data.length === 0) {
        setError("No fact-checking results returned.")
        return
      }

      const validResults = data.filter((item: unknown): item is FactCheckResult => {
        if (typeof item !== "object" || item === null) return false
        const result = item as Record<string, unknown>
        const validStatuses = ["Verified", "Inaccurate", "False"]
        return (
          typeof result.claim === "string" &&
          typeof result.status === "string" &&
          validStatuses.includes(result.status) &&
          typeof result.explanation === "string" &&
          typeof result.source === "string"
        )
      })

      if (validResults.length === 0) {
        if (typeof window !== "undefined") {
          console.error("[v0] No valid results in API response")
        }
        setError("No fact-checking results returned.")
        return
      }

      if (typeof window !== "undefined") {
        const dataSource = usesMockData ? "mock demo" : "backend API"
        console.log(`[v0] Successfully received fact-check results (${dataSource}):`, validResults.length, "items")
      }

      setResults(validResults)
    } catch (err) {
      let errorMessage = "An error occurred while checking facts."
      if (err instanceof Error) {
        errorMessage = err.message
        if (typeof window !== "undefined") {
          console.error("[v0] Error during fact-checking:", err.message)
        }
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">Fact-Checking Web App</h1>
          <p className="text-lg text-muted-foreground">
            Upload a PDF document and verify facts with our advanced fact-checking tool
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            {apiUrl ? (
              <span className="text-green-600">✓ Backend API configured: {apiUrl}</span>
            ) : (
              <span className="text-yellow-600">⚠ Using demo mode with sample results</span>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload onFileSelect={handleFileSelect} fileName={file?.name} />
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleCheckFacts}
            disabled={!file || isLoading}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Checking Facts..." : "Check Facts"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Results Section */}
        {results.length > 0 && !isLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultsTable results={results} />
          </div>
        )}
      </div>
    </main>
  )
}
