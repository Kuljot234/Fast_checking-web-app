"use client"

import { CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface StatusBadgeProps {
  status: "Verified" | "Inaccurate" | "False"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case "Verified":
        return {
          bg: "bg-success/10",
          text: "text-success",
          icon: CheckCircle,
          label: "Verified",
        }
      case "Inaccurate":
        return {
          bg: "bg-warning/10",
          text: "text-warning",
          icon: AlertCircle,
          label: "Inaccurate",
        }
      case "False":
        return {
          bg: "bg-error/10",
          text: "text-error",
          icon: XCircle,
          label: "False",
        }
    }
  }

  const styles = getStyles()
  const Icon = styles.icon

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${styles.bg} ${styles.text}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{styles.label}</span>
    </div>
  )
}
