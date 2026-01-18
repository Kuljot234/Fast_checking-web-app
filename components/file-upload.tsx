"use client"

import type React from "react"

import { useRef } from "react"
import { Upload } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  fileName?: string
}

export function FileUpload({ onFileSelect, fileName }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-primary/30 rounded-lg p-12 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <input ref={inputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />

        <div className="flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-primary mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">
            {fileName ? `Selected: ${fileName}` : "Drag and drop your PDF here"}
          </p>
          <p className="text-sm text-muted-foreground">
            {fileName ? "Click to select a different file" : "or click to browse"}
          </p>
        </div>
      </div>
    </div>
  )
}
