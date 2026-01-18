export interface FactCheckResult {
  claim: string
  status: "Verified" | "Inaccurate" | "False"
  explanation: string
  correct_value?: string
  source: string
}
