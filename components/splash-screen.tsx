"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation after 5 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 5000)

    // Complete after 5.7 seconds (700ms for exit animation)
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 5700)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-700 ease-out",
        isExiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Full splash background image (already contains logo, title, tagline, loading text) */}
      <Image
        src="/images/splash-bg.jpg"
        alt="Monday Night Football - Built for South London Ballers"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Loading text and animated dots */}
      <div
        className={cn(
          "absolute bottom-20 left-0 right-0 flex flex-col items-center gap-3 transition-all duration-700 ease-out pb-safe",
          isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <p className="text-sm text-muted-foreground">Initialising League...</p>
        <div className="flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}
