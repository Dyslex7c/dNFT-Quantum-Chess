"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSound } from "use-sound"

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
}

const INITIAL_BOARD = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
]

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

interface ChessBoardProps {
  onMove: (move: Move) => void
  isWhiteTurn: boolean
}

export default function ChessBoard({ onMove, isWhiteTurn }: ChessBoardProps) {
  const [board, setBoard] = useState(INITIAL_BOARD)
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [legalMoves, setLegalMoves] = useState<Position[]>([])
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [playMoveSound] = useSound("/move.mp3")
  const [playCaptureSound] = useSound("/capture.mp3")
  const [captureAnimation, setCaptureAnimation] = useState<Position | null>(null)

  const isWhitePiece = (piece: string) => piece && piece.charCodeAt(0) <= 9817
  const isBlackPiece = (piece: string) => piece && piece.charCodeAt(0) > 9817

  const getLegalMoves = (pos: Position): Position[] => {
    const piece = board[pos.row][pos.col]
    const moves: Position[] = []

    // Helper to check if a position is within bounds
    const isValid = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8

    // Helper to check if a position can be moved to
    const canMoveTo = (row: number, col: number) => {
      if (!isValid(row, col)) return false
      const targetPiece = board[row][col]
      return !targetPiece || (isWhitePiece(piece) ? isBlackPiece(targetPiece) : isWhitePiece(targetPiece))
    }

    if (!piece) return moves

    // Pawn moves
    if (piece === "♙" || piece === "♟") {
      const direction = isWhitePiece(piece) ? -1 : 1
      const startRow = isWhitePiece(piece) ? 6 : 1

      // Forward move
      if (isValid(pos.row + direction, pos.col) && !board[pos.row + direction][pos.col]) {
        moves.push({ row: pos.row + direction, col: pos.col })

        // Double move from start
        if (pos.row === startRow && !board[pos.row + direction * 2][pos.col]) {
          moves.push({ row: pos.row + direction * 2, col: pos.col })
        }
      }
      // Captures
      ;[-1, 1].forEach((offset) => {
        const newRow = pos.row + direction
        const newCol = pos.col + offset
        if (isValid(newRow, newCol)) {
          const targetPiece = board[newRow][newCol]
          if (targetPiece && (isWhitePiece(piece) ? isBlackPiece(targetPiece) : isWhitePiece(targetPiece))) {
            moves.push({ row: newRow, col: newCol })
          }
        }
      })
    }

    // Knight moves
    if (piece === "♘" || piece === "♞") {
      const knightMoves = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ]
      knightMoves.forEach(([rowOffset, colOffset]) => {
        const newRow = pos.row + rowOffset
        const newCol = pos.col + colOffset
        if (canMoveTo(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol })
        }
      })
    }

    // Bishop moves
    if (piece === "♗" || piece === "♝") {
      const directions = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]
      directions.forEach(([rowDir, colDir]) => {
        let newRow = pos.row + rowDir
        let newCol = pos.col + colDir
        while (canMoveTo(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol })
          if (board[newRow][newCol]) break
          newRow += rowDir
          newCol += colDir
        }
      })
    }

    // Rook moves
    if (piece === "♖" || piece === "♜") {
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]
      directions.forEach(([rowDir, colDir]) => {
        let newRow = pos.row + rowDir
        let newCol = pos.col + colDir
        while (canMoveTo(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol })
          if (board[newRow][newCol]) break
          newRow += rowDir
          newCol += colDir
        }
      })
    }

    // Queen moves (combination of bishop and rook)
    if (piece === "♕" || piece === "♛") {
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ]
      directions.forEach(([rowDir, colDir]) => {
        let newRow = pos.row + rowDir
        let newCol = pos.col + colDir
        while (canMoveTo(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol })
          if (board[newRow][newCol]) break
          newRow += rowDir
          newCol += colDir
        }
      })
    }

    // King moves
    if (piece === "♔" || piece === "♚") {
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ]
      directions.forEach(([rowDir, colDir]) => {
        const newRow = pos.row + rowDir
        const newCol = pos.col + colDir
        if (canMoveTo(newRow, newCol)) {
          moves.push({ row: newRow, col: newCol })
        }
      })
    }

    return moves
  }

  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col]
  
    if (selectedSquare) {
      // If clicking on a legal move square, make the move
      const isLegalMove = legalMoves.some((move) => move.row === row && move.col === col)
      
      if (isLegalMove) {
        // Execute the move (capture or regular)
        const from = selectedSquare
        const to = { row, col }
        const movingPiece = board[from.row][from.col]
        const capturedPiece = board[row][col]
        
        // Handle capture animation and sound
        if (capturedPiece) {
          setCaptureAnimation({ row, col })
          setTimeout(() => setCaptureAnimation(null), 500)
          playCaptureSound()
        } else {
          playMoveSound()
        }
        
        // Update board
        const newBoard = board.map((r) => [...r])
        newBoard[to.row][to.col] = movingPiece
        newBoard[from.row][from.col] = ""
        setBoard(newBoard)
        setSelectedSquare(null)
        setLegalMoves([])
        setLastMove({ from, to, piece: movingPiece, captured: capturedPiece })
        onMove({ from, to, piece: movingPiece, captured: capturedPiece })
      } 
      else if (piece && ((isWhiteTurn && isWhitePiece(piece)) || (!isWhiteTurn && isBlackPiece(piece)))) {
        // If clicking on a different piece of same color, select it
        setSelectedSquare({ row, col })
        setLegalMoves(getLegalMoves({ row, col }))
      } 
      else {
        // Otherwise clear selection
        setSelectedSquare(null)
        setLegalMoves([])
      }
    } else {
      // Initial piece selection - can only select your own pieces
      if (piece && ((isWhiteTurn && isWhitePiece(piece)) || (!isWhiteTurn && isBlackPiece(piece)))) {
        setSelectedSquare({ row, col })
        setLegalMoves(getLegalMoves({ row, col }))
      }
    }
  }

  return (
    <div className="relative aspect-square w-full max-w-3xl mx-auto">
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0.5 p-4 bg-gray-800 rounded-lg shadow-2xl">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isBlackSquare = (rowIndex + colIndex) % 2 === 1
            const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
            const isLegalMove = legalMoves.some((move) => move.row === rowIndex && move.col === colIndex)
            const isLastMove =
              lastMove &&
              ((lastMove.from.row === rowIndex && lastMove.from.col === colIndex) ||
                (lastMove.to.row === rowIndex && lastMove.to.col === colIndex))
            const isCaptureAnimating = captureAnimation?.row === rowIndex && captureAnimation?.col === colIndex

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  relative flex items-center justify-center
                  ${isBlackSquare ? "bg-gray-700" : "bg-gray-200"}
                  ${isSelected ? "ring-2 ring-blue-400 ring-opacity-75 shadow-lg" : ""}
                  ${isLastMove ? "ring-2 ring-yellow-400 ring-opacity-50" : ""}
                  transition-all duration-200
                `}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {/* Coordinate labels */}
                {colIndex === 0 && <span className="absolute left-1 top-1 text-xs opacity-50">{RANKS[rowIndex]}</span>}
                {rowIndex === 7 && (
                  <span className="absolute right-1 bottom-1 text-xs opacity-50">{FILES[colIndex]}</span>
                )}

                {/* Legal move indicator */}
                {isLegalMove && (
                  <div
                    className={`absolute inset-2 rounded-full 
                    ${
                      piece ? "border-4 border-green-400 border-opacity-50" : "bg-green-400 bg-opacity-25"
                    } animate-pulse`}
                  />
                )}

                {/* Chess piece */}
                <AnimatePresence>
                  {piece && (
                    <motion.div
                      key={`piece-${rowIndex}-${colIndex}`}
                      initial={isCaptureAnimating ? { scale: 1 } : { scale: 0.5, opacity: 0 }}
                      animate={
                        isCaptureAnimating ? { scale: 0, opacity: 0, rotate: 180 } : { scale: 1, opacity: 1, rotate: 0 }
                      }
                      exit={isCaptureAnimating ? { scale: 0, opacity: 0, rotate: 180 } : { scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`text-4xl cursor-grab active:cursor-grabbing
                        ${piece.charCodeAt(0) > 9817 ? "text-black" : "text-white"}
                        ${isSelected ? "drop-shadow-lg" : ""}
                        hover:scale-110 transition-transform duration-200
                      `}
                    >
                      {piece}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

