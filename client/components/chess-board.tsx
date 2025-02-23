"use client"

import { useState, useEffect } from "react"
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
import { updatePieceWeight } from "@/utils/gameEngine"

// Add interface for NFT mapping
interface NFTMapping {
  square: string;
  nft: {
    name: string;
    weight: number;
    ipfsHash?: string;
  };
}

interface ValuedNFTs {
  ipfsHash: string;
  name: string;
  weight: number;
  value: number;
}

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

interface RoomProps {
  p1Id: string;
  p2Id: string;
  R1: string;
  R2: string;
  roomId: string;
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
  isFlipped: boolean
  roomData: RoomProps | null
  valuedNFTs: ValuedNFTs[]
  setValuedNFTs: React.Dispatch<React.SetStateAction<ValuedNFTs[]>>
  count: number;
  setDel: React.Dispatch<React.SetStateAction<number>>
}

const ChessBoard = ({ onMove, isWhiteTurn, isFlipped, roomData, valuedNFTs, setValuedNFTs, count, setDel }: ChessBoardProps) => {
  const [game, setGame] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoves, setLegalMoves] = useState<string[]>([])
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [playMoveSound] = useSound("/move.mp3")
  const [playCaptureSound] = useSound("/capture.mp3")
  const [nftMappings, setNftMappings] = useState<NFTMapping[]>([]);
  const [currentFen, setCurrentFen] = useState(game.fen());

  useEffect(() => {
    // Load NFTs and create initial mappings
    const storedNFTs = localStorage.getItem("selectedNFTs");
    if (storedNFTs) {
      try {
        const nfts = JSON.parse(storedNFTs);
        // Map NFTs to initial white piece positions
        const initialMappings: NFTMapping[] = [
          { square: "a2", nft: nfts[0] }, // white pawns
          { square: "b2", nft: nfts[1] },
          { square: "c2", nft: nfts[2] },
          { square: "d2", nft: nfts[3] },
          { square: "e2", nft: nfts[4] },
          { square: "f2", nft: nfts[5] },
          { square: "g2", nft: nfts[6] },
          { square: "h2", nft: nfts[7] },
          { square: "a1", nft: nfts[8] }, // white rook
          { square: "b1", nft: nfts[9] }, // white knight
          { square: "c1", nft: nfts[10] }, // white bishop
          { square: "d1", nft: nfts[11] }, // white queen
          { square: "e1", nft: nfts[12] }, // white king
          { square: "f1", nft: nfts[13] }, // white bishop
          { square: "g1", nft: nfts[14] }, // white knight
          { square: "h1", nft: nfts[15] }, // white rook
        ];
        setNftMappings(initialMappings);
      } catch (error) {
        console.error("Error parsing stored NFTs:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (roomData?.p1Id) {
      const fetchValuedNFTs = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/v1/user/my-nfts?id=${roomData.p1Id}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setValuedNFTs(data);
        } catch (error) {
          console.error('Error fetching valued NFTs:', error);
        }
      };

      fetchValuedNFTs();
    }
  }, [roomData]);

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

  const handleSquareClick = async (row: number, col: number) => {
    const square = getSquareFromIndices(row, col);
    const piece = game.get(square as Square);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (piece && ((isWhiteTurn && piece.color === "w") || (!isWhiteTurn && piece.color === "b"))) {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as Square, verbose: true }).map((m) => m.to);
        setLegalMoves(moves);
        return;
      }

      const moveAttempt = game.moves({
        square: selectedSquare as Square,
        verbose: true
      }).find(m => m.to === square);

      if (moveAttempt) {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: "q"
        });

        if (move) {
          // If it's a white piece being moved, log the NFT details
          if (move.color === 'w') {
            const nftMapping = nftMappings.find(m => m.square === selectedSquare);
            if (nftMapping && roomData) {
              // Pass the current FEN to the utility function
              const updatedWeight = await updatePieceWeight(
                nftMapping.nft.ipfsHash || '',
                nftMapping.nft.weight,
                roomData.R1,
                roomData.R2,
                selectedSquare,
                square,
                currentFen,
                setDel
              );

              const pieceValueMap: Record<string, number> = {
                p: 1, // pawn
                n: 3, // knight
                b: 3, // bishop
                r: 5, // rook
                q: 9, // queen
                k: 15, // king
              };
              const p = pieceValueMap[move.piece] || 1;

              console.log("Updated Weight:", updatedWeight);
              console.log(p);

              const newValue = (updatedWeight / p) / 1000;

              setValuedNFTs(prevNFTs =>
                prevNFTs.map(nft =>
                  nft.ipfsHash === nftMapping.nft.ipfsHash
                    ? { ...nft, value: newValue, weight: updatedWeight }
                    : nft
                )
              );

              console.log("Updated NFT Value:", newValue);

              setNftMappings(prevMappings =>
                prevMappings.map(mapping =>
                  mapping.square === selectedSquare
                    ? { ...mapping, square: square, nft: { ...mapping.nft, weight: updatedWeight } }
                    : mapping
                )
              );
            }
          }

          const isEnPassant = move.flags.includes('e');
          if (isEnPassant || move.captured) {
            playCaptureSound();
          } else {
            playMoveSound();
          }

          const fromRow = RANKS.indexOf(selectedSquare[1]);
          const fromCol = FILES.indexOf(selectedSquare[0]);
          const last: Move = {
            from: { row: fromRow, col: fromCol },
            to: { row, col },
            piece: move.piece,
            captured: move.captured,
            isCheck: game.inCheck(),
            isCheckmate: game.isCheckmate(),
            isEnPassant: isEnPassant
          };
          setLastMove(last);
          onMove(last);

          // Update the FEN state after the move
          setCurrentFen(game.fen());

          setGame(new Chess(game.fen()));
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }
    }

    if (piece && ((isWhiteTurn && piece.color === "w") || (!isWhiteTurn && piece.color === "b"))) {
      setSelectedSquare(square);
      const moves = game.moves({ square: square as Square, verbose: true }).map((m) => m.to);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const isInCheck = game.inCheck()
  const checkedKingSquare = isInCheck ? findKingPosition(isWhiteTurn ? 'w' : 'b') : null

  return (
    <div className="relative aspect-square w-full max-w-3xl mx-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-4">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-px bg-gray-600">
          {(isFlipped ? board.slice().reverse() : board).map((rowData, rowIndex) =>
            (isFlipped ? rowData.slice().reverse() : rowData).map((pieceObj, colIndex) => {
              const originalRowIndex = isFlipped ? 7 - rowIndex : rowIndex;
              const originalColIndex = isFlipped ? 7 - colIndex : colIndex;
              const square = getSquareFromIndices(originalRowIndex, originalColIndex);

              const isBlackSquare = (originalRowIndex + originalColIndex) % 2 === 1;
              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoves.includes(square);
              const isLastMove =
                lastMove &&
                (getSquareFromIndices(lastMove.from.row, lastMove.from.col) === square ||
                  getSquareFromIndices(lastMove.to.row, lastMove.to.col) === square)
              const isCheckedKing = square === checkedKingSquare;

              return (
                <div
                  key={square}
                  className={`relative flex items-center justify-center
                    ${isBlackSquare ? "bg-gray-600" : "bg-gray-300"}
                    ${isSelected ? "ring-2 ring-yellow-400 ring-opacity-70" : ""}
                    ${isLastMove ? "ring-1 ring-yellow-400 ring-opacity-40" : ""}
                    ${isCheckedKing ? "bg-red-500 bg-opacity-50" : ""}
                    transition-all duration-200`}
                  onClick={() => handleSquareClick(originalRowIndex, originalColIndex)}
                >
                  {colIndex === 0 && (
                    <span
                      className={`absolute left-1 top-1 text-xs font-semibold ${isBlackSquare ? "text-gray-300" : "text-gray-600"
                        } opacity-60`}
                    >
                      {RANKS[originalRowIndex]}
                    </span>
                  )}
                  {rowIndex === 7 && (
                    <span
                      className={`absolute right-1 bottom-1 text-xs font-semibold ${isBlackSquare ? "text-gray-300" : "text-gray-600"
                        } opacity-60`}
                    >
                      {FILES[originalColIndex]}
                    </span>
                  )}

                  {isLegalMove && (
                    <div
                      className={`absolute inset-2 rounded-full ${pieceObj ? "border-4 border-yellow-400 border-opacity-40" : "bg-yellow-400 bg-opacity-20"
                        }`}
                    ></div>
                  )}

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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ChessBoard;