"use client"

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
        </div>
        <p className="text-muted-foreground">Processing your document...</p>
      </div>
    </div>
  )
}
