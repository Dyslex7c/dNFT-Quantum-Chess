"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Timer, AlertTriangle } from "lucide-react"
import { useState } from "react"
import type { Move } from "./chess-board"

interface GameInfoProps {
  moves: Move[]
  isWhiteTurn: boolean
  gameStatus: "active" | "check" | "checkmate" | "stalemate"
  whiteTime: number
  blackTime: number
}

export default function GameInfo({ moves, isWhiteTurn, gameStatus, whiteTime, blackTime }: GameInfoProps) {
  const [messages, setMessages] = useState<{ text: string; player: "white" | "black" }[]>([])
  const [newMessage, setNewMessage] = useState("")

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMoveNotation = (move: Move) => {
    const files = "abcdefgh"
    const ranks = "87654321"
    const from = `${files[move.from.col]}${ranks[move.from.row]}`
    const to = `${files[move.to.col]}${ranks[move.to.row]}`
    const piece = move.piece === "♙" || move.piece === "♟" ? "" : move.piece
    const capture = move.captured ? "x" : ""
    const check = move.isCheck ? "+" : ""
    const checkmate = move.isCheckmate ? "#" : ""
    return `${piece}${from}${capture}${to}${check}${checkmate}`
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      setMessages((prev) => [...prev, { text: newMessage, player: isWhiteTurn ? "white" : "black" }])
      setNewMessage("")
    }
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 space-y-6">
      {/* Game Status */}
      {gameStatus !== "active" && (
        <div
          className={`rounded-md p-3 flex items-center gap-2
          ${
            gameStatus === "check"
              ? "bg-yellow-500/20 text-yellow-400"
              : gameStatus === "checkmate"
                ? "bg-red-500/20 text-red-400"
                : "bg-blue-500/20 text-blue-400"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold capitalize">{gameStatus}!</span>
        </div>
      )}

      {/* Game Info Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Game Info</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Timer className="h-4 w-4" />
            10+0
          </Button>
          <Button size="sm" variant="outline" className="h-8">
            Ranked
          </Button>
        </div>
      </div>

      {/* Move History */}
      <div>
        <h3 className="mb-2 font-semibold text-blue-400">Move History</h3>
        <ScrollArea className="h-[300px] rounded-md border border-gray-700 bg-gray-900 p-4">
          <div className="space-y-2">
            {moves.map((move, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded
                  ${index % 2 === 0 ? "bg-gray-800/50" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{Math.floor(index / 2) + 1}.</span>
                  <span className="font-mono">{getMoveNotation(move)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {move.captured && <span className="text-red-400 text-lg">{move.captured}</span>}
                  <span className="text-sm text-gray-400">
                    {index % 2 === 0 ? formatTime(whiteTime) : formatTime(blackTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Section */}
      <div>
        <h3 className="mb-2 font-semibold text-blue-400">Chat</h3>
        <ScrollArea className="h-[200px] rounded-md border border-gray-700 bg-gray-900 p-4 mb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                msg.player === "white" ? "ml-auto bg-blue-500/20 text-blue-100" : "bg-purple-500/20 text-purple-100"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded bg-gray-900 px-3 py-2 text-sm outline-none ring-blue-400 focus:ring-2"
          />
          <Button type="submit" size="icon" variant="outline" className="h-9 w-9">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

