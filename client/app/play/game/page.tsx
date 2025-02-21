"use client"

import { useState, useEffect } from "react"
import ChessBoard from "@/components/chess-board"
import GameInfo from "@/components/game-info"
import { Button } from "@/components/ui/button"
import { Clock, Crown, Flag, RotateCcw } from "lucide-react"
import type { Move } from "@/components/chess-board"

const INITIAL_TIME = 600 // 10 minutes in seconds

export default function ChessGame() {
  const [moves, setMoves] = useState<Move[]>([])
  const [isWhiteTurn, setIsWhiteTurn] = useState(true)
  const [gameStatus, setGameStatus] = useState<"active" | "check" | "checkmate" | "stalemate">("active")
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME)
  const [blackTime, setBlackTime] = useState(INITIAL_TIME)

  // Timer effect
  useEffect(() => {
    if (gameStatus === "active") {
      const timer = setInterval(() => {
        if (isWhiteTurn) {
          setWhiteTime((prev) => Math.max(0, prev - 1))
        } else {
          setBlackTime((prev) => Math.max(0, prev - 1))
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isWhiteTurn, gameStatus])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMove = (move: Move) => {
    setMoves((prev) => [...prev, move])
    setIsWhiteTurn(!isWhiteTurn)
    // Update game status based on move
    if (move.isCheckmate) {
      setGameStatus("checkmate")
    } else if (move.isCheck) {
      setGameStatus("check")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-400">Etheredrez</h1>
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2 hover:bg-red-500/20 hover:text-red-400">
              <Flag className="h-4 w-4" />
              Resign
            </Button>
            <Button variant="outline" className="gap-2 hover:bg-yellow-500/20 hover:text-yellow-400">
              <RotateCcw className="h-4 w-4" />
              Offer Draw
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            {/* White Player Info */}
            <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/50">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">GrandMaster1</div>
                  <div className="text-sm text-blue-400">Rating: 3048</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${isWhiteTurn ? "text-blue-400 animate-pulse" : "text-gray-500"}`} />
                <span className="text-xl font-mono">{formatTime(whiteTime)}</span>
              </div>
            </div>

            {/* Chess Board */}
            <ChessBoard onMove={handleMove} isWhiteTurn={isWhiteTurn} />

            {/* Black Player Info */}
            <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 shadow-lg shadow-purple-500/50">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">QueenSlayer</div>
                  <div className="text-sm text-purple-400">Rating: 3015</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${!isWhiteTurn ? "text-purple-400 animate-pulse" : "text-gray-500"}`} />
                <span className="text-xl font-mono">{formatTime(blackTime)}</span>
              </div>
            </div>
          </div>

          {/* Game Info Sidebar */}
          <GameInfo
            moves={moves}
            isWhiteTurn={isWhiteTurn}
            gameStatus={gameStatus}
            whiteTime={whiteTime}
            blackTime={blackTime}
          />
        </div>
      </div>
    </div>
  )
}

