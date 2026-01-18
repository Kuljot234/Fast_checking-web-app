"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { StatusBadge } from "./status-badge"
import type { FactCheckResult } from "@/types/fact-check"

interface ResultsTableProps {
  results: FactCheckResult[]
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Claim</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Explanation</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Source</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <>
                <tr key={`row-${index}`} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">
                    <p className="line-clamp-2">{result.claim}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={result.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <p className="line-clamp-2">{result.explanation}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <p className="line-clamp-2">{result.source}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleRow(index)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      aria-label={expandedRows.has(index) ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${expandedRows.has(index) ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                </tr>
                {expandedRows.has(index) && (
                  <tr key={`expanded-${index}`} className="bg-secondary/20 border-b border-border">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Full Explanation</h4>
                          <p className="text-sm text-muted-foreground">{result.explanation}</p>
                        </div>
                        {result.correct_value && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-1">Correct Value</h4>
                            <p className="text-sm text-muted-foreground">{result.correct_value}</p>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Source</h4>
                          <p className="text-sm text-muted-foreground">{result.source}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
