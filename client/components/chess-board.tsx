"use client"

import { useState } from "react"
import { Chess, type Square } from "chess.js"
import { motion, AnimatePresence } from "framer-motion"
import { useSound } from "use-sound"
import Image from "next/image"

// Import SVG pieces
import WhitePawn from "@/public/white-pawn.svg"
import WhiteKnight from "@/public/white-knight.svg"
import WhiteBishop from "@/public/white-bishop.svg"
import WhiteRook from "@/public/white-rook.svg"
import WhiteQueen from "@/public/white-queen.svg"
import WhiteKing from "@/public/white-king.svg"
import BlackPawn from "@/public/black-pawn.svg"
import BlackKnight from "@/public/black-knight.svg"
import BlackBishop from "@/public/black-bishop.svg"
import BlackRook from "@/public/black-rook.svg"
import BlackQueen from "@/public/black-queen.svg"
import BlackKing from "@/public/black-king.svg"

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  piece: string
  captured?: string
  isCheck?: boolean
  isCheckmate?: boolean
  isEnPassant?: boolean
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const pieceSvgs: Record<string, Record<string, any>> = {
  w: {
    p: WhitePawn,
    n: WhiteKnight,
    b: WhiteBishop,
    r: WhiteRook,
    q: WhiteQueen,
    k: WhiteKing,
  },
  b: {
    p: BlackPawn,
    n: BlackKnight,
    b: BlackBishop,
    r: BlackRook,
    q: BlackQueen,
    k: BlackKing,
  },
}

interface ChessBoardProps {
  onMove: (move: Move) => void
  isWhiteTurn: boolean
}

export default function ChessBoard({ onMove, isWhiteTurn }: ChessBoardProps) {
  const [game, setGame] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoves, setLegalMoves] = useState<string[]>([])
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [playMoveSound] = useSound("/move.mp3")
  const [playCaptureSound] = useSound("/capture.mp3")

  const getSquareFromIndices = (row: number, col: number): string => FILES[col] + RANKS[row]

  const board = game.board()

  // Find king positions
  const findKingPosition = (color: 'w' | 'b'): string | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.type === 'k' && piece.color === color) {
          return getSquareFromIndices(row, col)
        }
      }
    }
    return null
  }

  const handleSquareClick = (row: number, col: number) => {
    const square = getSquareFromIndices(row, col)
    const piece = game.get(square as Square)

    // If a square is already selected...
    if (selectedSquare) {
      // If clicking the same square, deselect it
      if (selectedSquare === square) {
        setSelectedSquare(null)
        setLegalMoves([])
        return
      }

      // If clicking a different piece of the same color, select the new piece
      if (piece && 
          ((isWhiteTurn && piece.color === "w") || (!isWhiteTurn && piece.color === "b"))) {
        setSelectedSquare(square)
        const moves = game.moves({ square: square as Square, verbose: true }).map((m) => m.to)
        setLegalMoves(moves)
        return
      }

      // Try to make a move to the clicked square
      const moveAttempt = game.moves({ 
        square: selectedSquare as Square, 
        verbose: true 
      }).find(m => m.to === square)

      if (moveAttempt) {
        const move = game.move({ 
          from: selectedSquare, 
          to: square, 
          promotion: "q" 
        })

        if (move) {
          // Determine if this was an en passant capture
          const isEnPassant = move.flags.includes('e')
          
          if (isEnPassant || move.captured) {
            playCaptureSound()
          } else {
            playMoveSound()
          }

          const fromRow = RANKS.indexOf(selectedSquare[1])
          const fromCol = FILES.indexOf(selectedSquare[0])
          const last: Move = {
            from: { row: fromRow, col: fromCol },
            to: { row, col },
            piece: move.piece,
            captured: move.captured,
            isCheck: game.inCheck(),
            isCheckmate: game.isCheckmate(),
            isEnPassant: isEnPassant
          }
          setLastMove(last)
          onMove(last)

          setGame(new Chess(game.fen()))
          setSelectedSquare(null)
          setLegalMoves([])
          return
        }
      }
    }

    // If no square is selected and clicking a valid piece, select it
    if (piece && ((isWhiteTurn && piece.color === "w") || (!isWhiteTurn && piece.color === "b"))) {
      setSelectedSquare(square)
      const moves = game.moves({ square: square as Square, verbose: true }).map((m) => m.to)
      setLegalMoves(moves)
    } else {
      setSelectedSquare(null)
      setLegalMoves([])
    }
  }

  const isInCheck = game.inCheck()
  const checkedKingSquare = isInCheck ? findKingPosition(isWhiteTurn ? 'w' : 'b') : null

  return (
    <div className="relative aspect-square w-full max-w-3xl mx-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-4">
        {/* Chess board grid */}
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-px bg-gray-600">
          {board.map((rowData, rowIndex) =>
            rowData.map((pieceObj, colIndex) => {
              const square = getSquareFromIndices(rowIndex, colIndex)
              const isBlackSquare = (rowIndex + colIndex) % 2 === 1
              const isSelected = selectedSquare === square
              const isLegalMove = legalMoves.includes(square)
              const isLastMove =
                lastMove &&
                (getSquareFromIndices(lastMove.from.row, lastMove.from.col) === square ||
                  getSquareFromIndices(lastMove.to.row, lastMove.to.col) === square)
              const isCheckedKing = square === checkedKingSquare

              return (
                <div
                  key={square}
                  className={`relative flex items-center justify-center
                    ${isBlackSquare ? "bg-gray-600" : "bg-gray-300"}
                    ${isSelected ? "ring-2 ring-yellow-400 ring-opacity-70" : ""}
                    ${isLastMove ? "ring-1 ring-yellow-400 ring-opacity-40" : ""}
                    ${isCheckedKing ? "bg-red-500 bg-opacity-50" : ""}
                    transition-all duration-200`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {/* Coordinate labels */}
                  {colIndex === 0 && (
                    <span
                      className={`absolute left-1 top-1 text-xs font-semibold ${
                        isBlackSquare ? "text-gray-300" : "text-gray-600"
                      } opacity-60`}
                    >
                      {RANKS[rowIndex]}
                    </span>
                  )}
                  {rowIndex === 7 && (
                    <span
                      className={`absolute right-1 bottom-1 text-xs font-semibold ${
                        isBlackSquare ? "text-gray-300" : "text-gray-600"
                      } opacity-60`}
                    >
                      {FILES[colIndex]}
                    </span>
                  )}

                  {/* Legal move indicator */}
                  {isLegalMove && (
                    <div
                      className={`absolute inset-2 rounded-full ${
                        pieceObj ? "border-4 border-yellow-400 border-opacity-40" : "bg-yellow-400 bg-opacity-20"
                      }`}
                    ></div>
                  )}

                  {/* Chess piece */}
                  <AnimatePresence>
                    {pieceObj && (
                      <motion.div
                        key={`piece-${square}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`w-4/5 h-4/5 cursor-pointer hover:scale-110 transition-transform duration-200 
                          ${isCheckedKing ? "drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]" : ""}`}
                      >
                        <Image
                          src={pieceSvgs[pieceObj.color][pieceObj.type] || "/placeholder.svg"}
                          alt={`${pieceObj.color === "w" ? "White" : "Black"} ${pieceObj.type}`}
                          width={50}
                          height={50}
                          className="w-full h-full"
                          priority
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}