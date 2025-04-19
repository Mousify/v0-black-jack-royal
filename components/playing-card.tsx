"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface PlayingCardProps {
  suit: string
  rank: string
  hidden?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  onClick?: () => void
}

export function PlayingCard({ suit, rank, hidden = false, className, size = "md", onClick }: PlayingCardProps) {
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className={cn("playing-card-placeholder", className)} />
  }

  // Determine if the card is red (hearts or diamonds)
  const isRed = suit === "hearts" || suit === "diamonds"

  // Determine card dimensions based on size
  const cardSizes = {
    sm: "w-12 h-16",
    md: "w-16 h-22",
    lg: "w-20 h-28",
  }

  // Determine font sizes based on size
  const fontSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  // Determine corner indicator sizes
  const cornerSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  // Get suit symbol
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥"
      case "diamonds":
        return "♦"
      case "clubs":
        return "♣"
      case "spades":
        return "♠"
      default:
        return "?"
    }
  }

  const suitSymbol = getSuitSymbol(suit)

  if (hidden) {
    return (
      <div
        className={cn(
          "rounded-lg bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-800 shadow-lg flex items-center justify-center",
          cardSizes[size],
          className,
        )}
        onClick={onClick}
      >
        <div className="w-3/4 h-3/4 rounded-md bg-blue-800 flex items-center justify-center">
          <div className="text-2xl font-bold text-white">?</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-white border border-gray-300 shadow-lg relative select-none",
        cardSizes[size],
        className,
      )}
      onClick={onClick}
    >
      {/* Top left corner */}
      <div className={cn("absolute top-1 left-1.5", isRed ? "text-red-600" : "text-black", cornerSizes[size])}>
        <div>{rank}</div>
        <div>{suitSymbol}</div>
      </div>

      {/* Center symbol */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          isRed ? "text-red-600" : "text-black",
          fontSizes[size],
        )}
      >
        {suitSymbol}
      </div>

      {/* Bottom right corner (rotated) */}
      <div
        className={cn(
          "absolute bottom-1 right-1.5 rotate-180",
          isRed ? "text-red-600" : "text-black",
          cornerSizes[size],
        )}
      >
        <div>{rank}</div>
        <div>{suitSymbol}</div>
      </div>
    </div>
  )
}
