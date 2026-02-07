import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-destructive',
    info: 'bg-primary',
  }[type]

  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white shadow-lg",
        bgColor
      )}
    >
      {message}
    </div>
  )
}
