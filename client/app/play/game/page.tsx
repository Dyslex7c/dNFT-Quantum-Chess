"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import ChessBoard from "@/components/chess-board";
import GameInfo from "@/components/game-info";
import { Clock, Crown } from "lucide-react";
import type { Move } from "@/components/chess-board";
import { useSearchParams } from "next/navigation";

const INITIAL_TIME = 600; // 10 minutes in seconds

interface NFTProps {
  name: string;
  ipfsHash: string;
  weight: number;
}

interface RoomProps {
  p1Id: string;
  p2Id: string;
  R1: string;
  R2: string;
  roomId: string;
}

// Updated sorting function with correct type annotation
const sortNFTsForChessPieces = (nfts: NFTProps[]): NFTProps[] => {
  const pieceOrder = [
    // First 8 pawns
    { prefix: "pawn", positions: ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"] },
    // First rook
    { prefix: "rook", positions: ["a1"] },
    // First knight
    { prefix: "knight", positions: ["b1"] },
    // First bishop
    { prefix: "bishop", positions: ["c1"] },
    // Queen
    { prefix: "queen", positions: ["d1"] },
    // King
    { prefix: "king", positions: ["e1"] },
    // Second bishop
    { prefix: "bishop", positions: ["f1"] },
    // Second knight
    { prefix: "knight", positions: ["g1"] },
    // Second rook
    { prefix: "rook", positions: ["h1"] }
  ];

  const sortedNFTs: NFTProps[] = [];
  const unusedNFTs = [...nfts];

  // Sort for each piece type
  pieceOrder.forEach(({ prefix, positions }) => {
    positions.forEach((position) => {
      const matchingNFTs = unusedNFTs.filter(nft =>
        nft.name.toLowerCase().includes(prefix.toLowerCase())
      );

      if (matchingNFTs.length > 0) {
        const nft = matchingNFTs[0];
        sortedNFTs.push(nft);
        const index = unusedNFTs.findIndex(n => n.name === nft.name);
        if (index !== -1) {
          unusedNFTs.splice(index, 1);
        }
      }
    });
  });

  // Add any remaining NFTs at the end
  sortedNFTs.push(...unusedNFTs);

  return sortedNFTs;
};

export default function ChessGame() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<"active" | "check" | "checkmate" | "stalemate">("active");
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);
  const [isFlipped, setIsFlipped] = useState(false);
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFTProps[]>([]);
  const [roomData, setRoomData] = useState<RoomProps | null>(null);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  // Fetch room data from the API
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/v1/room/get-room/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch room data");
        }
        const data = await response.json();
        setRoomData(data);

        // Update board orientation based on player position
        if (address && data.p2Id === address) {
          setIsFlipped(true);
        } else {
          setIsFlipped(false);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    if (id) {
      fetchRoomData();
    }
  }, [id, address]);

  //console.log(roomData);

  useEffect(() => {
    if (gameStatus === "active") {
      const timer = setInterval(() => {
        if (isWhiteTurn) {
          setWhiteTime((prev) => Math.max(0, prev - 1));
        } else {
          setBlackTime((prev) => Math.max(0, prev - 1));
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isWhiteTurn, gameStatus]);

  useEffect(() => {
    // Load and sort NFTs from localStorage
    const storedNFTs = localStorage.getItem("selectedNFTs");
    if (storedNFTs) {
      try {
        const parsedNFTs = JSON.parse(storedNFTs) as NFTProps[];
        if (Array.isArray(parsedNFTs)) {
          const sortedNFTs = sortNFTsForChessPieces(parsedNFTs);
          setNfts(sortedNFTs);
          // Store the sorted NFTs back in localStorage
          localStorage.setItem("selectedNFTs", JSON.stringify(sortedNFTs));
        }
      } catch (error) {
        console.error("Error parsing stored NFTs:", error);
      }
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMove = (move: Move) => {
    setMoves((prev) => [...prev, move]);
    setIsWhiteTurn(!isWhiteTurn);
    const storedNFTs = localStorage.getItem("selectedNFTs");
    if (storedNFTs) {
      setNfts(JSON.parse(storedNFTs));
    }

    if (move.isCheckmate) {
      setGameStatus("checkmate");
    } else if (move.isCheck) {
      setGameStatus("check");
    }
  };

  return (
    <div className="w-screen bg-gray-900 text-white p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto] gap-4 h-full">
        <div className="flex flex-col space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-bold text-blue-400">Etheredrez</h1>

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
                    <div className="text-sm text-blue-400">{roomData?.R2}</div>
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
              <ChessBoard onMove={handleMove} isWhiteTurn={isWhiteTurn} isFlipped={isFlipped} roomData={roomData} />
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
                    <div className="text-sm text-purple-400">{roomData?.R1}</div>
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
        <div className="flex flex-col space-y-4">
          <GameInfo moves={moves} />
        </div>

        {/* Display NFTs */}
        <div className="bg-gray-800 rounded-xl p-4 -mt-20">
          <h2 className="text-xl font-bold text-blue-400 mb-2">Your NFTs</h2>
          {nfts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {nfts.map((nft, index) => (
                <div key={index} className="p-2 bg-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-300 font-medium">{nft.name}</p>
                  <p className="text-sm text-gray-400">Weight: {nft.weight.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No NFTs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}