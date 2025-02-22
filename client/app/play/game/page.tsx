"use client"

import { useState, useEffect } from "react"
import ChessBoard from "@/components/chess-board"
import GameInfo from "@/components/game-info"
import { Clock, Crown } from "lucide-react"
import type { Move } from "@/components/chess-board"

const INITIAL_TIME = 600 // 10 minutes in seconds

export default function ChessGame() {
  const [moves, setMoves] = useState<Move[]>([])
  const [isWhiteTurn, setIsWhiteTurn] = useState(true)
  const [gameStatus, setGameStatus] = useState<"active" | "check" | "checkmate" | "stalemate">("active")
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME)
  const [blackTime, setBlackTime] = useState(INITIAL_TIME)

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
    if (move.isCheckmate) {
      setGameStatus("checkmate")
    } else if (move.isCheck) {
      setGameStatus("check")
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto] gap-4 h-full">
        <div className="flex flex-col space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-bold text-blue-400">Chess Forge</h1>

          {/* Combined Players + Board Container */}
          <div className="bg-gray-800 rounded-xl p-4 w-fit mx-auto">
            {/* White Player Info */}
            <div className="rounded-t-lg bg-gray-750 p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">GrandMaster1</div>
                    <div className="text-sm text-blue-400">3048</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isWhiteTurn ? "text-blue-400 animate-pulse" : "text-gray-500"}`} />
                  <span className="font-mono">{formatTime(blackTime)}</span>
                </div>
              </div>
            </div>

            {/* Chess Board */}
            <div className="w-96 h-96 my-4">
              <ChessBoard onMove={handleMove} isWhiteTurn={isWhiteTurn} />
            </div>

            {/* Black Player Info */}
            <div className="rounded-b-lg bg-gray-750 p-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 shadow-lg">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">QueenSlayer</div>
                    <div className="text-sm text-purple-400">3015</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${!isWhiteTurn ? "text-purple-400 animate-pulse" : "text-gray-500"}`} />
                  <span className="font-mono">{formatTime(whiteTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col">
          <GameInfo moves={moves} />
        </div>
      </div>
    </div>
  )
}