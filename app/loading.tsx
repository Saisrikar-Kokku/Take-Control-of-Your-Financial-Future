'use client'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span>Loading...</span>
      </div>
    </div>
  )
}

