"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Coins, BarChart2, Flame } from "lucide-react"

interface GameStatsProps {
  balance: number
  bet: number
  handsPlayed: number
  streak: number
}

export function GameStats({ balance, bet, handsPlayed, streak }: GameStatsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-black/50 text-white border-yellow-500/50 hover:bg-black/70">
          <BarChart2 className="h-4 w-4 mr-2 text-yellow-500" />
          Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/90 border-yellow-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-yellow-500">Game Statistics</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Balance</h3>
            <Badge
              variant="outline"
              className="bg-black/50 text-yellow-500 border-yellow-500/50 flex items-center w-fit"
            >
              <Coins className="h-3 w-3 mr-1" />
              {balance}
            </Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Current Bet</h3>
            <Badge variant="outline" className="bg-black/50 text-white border-yellow-500/50 flex items-center w-fit">
              {bet}
            </Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Hands Played</h3>
            <Badge variant="outline" className="bg-black/50 text-white border-yellow-500/50 flex items-center w-fit">
              {handsPlayed}
            </Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Win Streak</h3>
            <Badge
              variant="outline"
              className="bg-black/50 text-orange-500 border-orange-500/50 flex items-center w-fit"
            >
              <Flame className="h-3 w-3 mr-1" />
              {streak}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
