"use client"

import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Move } from "./chess-board"

interface GameInfoProps {
  moves: Move[]
}

export default function GameInfo({ moves }: GameInfoProps) {
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

  // Group moves into pairs (white and black)
  const getPairedMoves = () => {
    const pairs = []
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        white: moves[i],
        black: moves[i + 1] || null
      })
    }
    return pairs
  }

  return (
    <div className="rounded-lg bg-gray-800 p-3">
      <h3 className="mb-2 text-sm font-semibold text-blue-400">Move History</h3>
      <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border border-gray-700 bg-gray-900 p-2">
        <div className="space-y-1">
          {getPairedMoves().map((pair, index) => (
            <div
              key={index}
              className="grid grid-cols-[2rem_8rem_8rem] gap-2 p-1.5 rounded text-sm bg-gray-800/50"
            >
              <span className="text-gray-500 text-xs">{index + 1}.</span>
              <div className="flex items-center font-mono">
                <span>{getMoveNotation(pair.white)}</span>
                {pair.white.captured && (
                  <span className="text-red-400 ml-2">{pair.white.captured}</span>
                )}
              </div>
              {pair.black && (
                <div className="flex items-center font-mono">
                  <span>{getMoveNotation(pair.black)}</span>
                  {pair.black.captured && (
                    <span className="text-red-400 ml-2">{pair.black.captured}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}