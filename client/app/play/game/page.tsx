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

interface ValuedNFTs {
  ipfsHash: string;
  name: string;
  weight: number;
  value: number;
}

interface RoomProps {
  p1Id: string;
  p2Id: string;
  R1: string;
  R2: string;
  roomId: string;
}

export interface PieceProps {
  ipfsHash: string;
  weight: number;
  name: string;
  value: number;
}

export interface PlayerAccount {
  userName: string;
  metamaskId: string;
  rating: number;
  pieceNFTs: PieceProps[];
}

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
  const [valuedNFTs, setValuedNFTs] = useState<ValuedNFTs[]>([]);
  const [count, setCount] = useState<number>(0);
  const [del, setDel] = useState<number>(0);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [player1Account, setPlayer1Account] = useState<PlayerAccount | null>(null);
  const [player2Account, setPlayer2Account] = useState<PlayerAccount | null>(null);

  useEffect(() => {
    const fetchPlayerAccounts = async () => {
      if (!roomData?.p1Id || !roomData?.p2Id) return;
      try {
        const [player1Response, player2Response] = await Promise.all([
          fetch(`http://localhost:5000/api/v1/user/account?id=${roomData.p1Id}`),
          fetch(`http://localhost:5000/api/v1/user/account?id=${roomData.p2Id}`)
        ]);

        if (!player1Response.ok || !player2Response.ok) {
          throw new Error("Failed to fetch player accounts");
        }

        const [player1Data, player2Data] = await Promise.all([
          player1Response.json(),
          player2Response.json()
        ]);

        setPlayer1Account(player1Data);
        setPlayer2Account(player2Data);

      } catch (error) {
        console.error("Error fetching player accounts:", error);
      }
    };

    fetchPlayerAccounts();
  }, [roomData?.p1Id, roomData?.p2Id]);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/v1/room/get-room/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch room data");
        }
        const data = await response.json();
        setRoomData(data);
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
    const storedNFTs = localStorage.getItem("selectedNFTs");
    if (storedNFTs) {
      try {
        const parsedNFTs = JSON.parse(storedNFTs) as NFTProps[];
        if (Array.isArray(parsedNFTs)) {
          const sortedNFTs = sortNFTsForChessPieces(parsedNFTs);
          setNfts(sortedNFTs);
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

  const calculateG = () => {
    return del * (20 / (count + 0.002));
  };

  const calculateT = () => {
    return ((1 + (parseInt(roomData?.R1 ?? "0") - 1500) / 400) * (20 / (count + 0.002)));
  }

  const updateUser = async (valuedNFTs: PieceProps[]) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/user/update-nfts?id=${roomData?.p1Id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valuedNFTs: valuedNFTs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update valued NFTs");
      }

      console.log("Valued NFTs updated successfully");
    } catch (error) {
      console.error("Error updating valued NFTs:", error);
    }
  }

  const handleMove = async (move: Move) => {
    if (isWhiteTurn) {
      setCount((prev) => prev + 1);
    }
    setMoves((prev) => [...prev, move]);
    setIsWhiteTurn(!isWhiteTurn);
    const storedNFTs = localStorage.getItem("selectedNFTs");
    if (storedNFTs) {
      setNfts(JSON.parse(storedNFTs));
    }

    if (move.isCheckmate) {
      setGameStatus("checkmate");
      setShowPopup(true);
      await updateUser(valuedNFTs);
    } else if (move.isCheck) {
      setGameStatus("check");
    }
  };

  return (
    <div className="w-screen bg-gray-900 text-white p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto] gap-4 h-full">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold text-blue-400">Chess Forge</h1>
          <div className="bg-gray-800 rounded-xl p-4 w-fit mx-auto">
            <div className="rounded-t-lg bg-gray-750 p-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">{player2Account?.userName}</div>
                    <div className="text-sm text-blue-400">{player2Account?.rating}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isWhiteTurn ? "text-blue-400 animate-pulse" : "text-gray-500"}`} />
                  <span className="font-mono">{formatTime(blackTime)}</span>
                </div>
              </div>
            </div>
            <div className="w-96 h-96 my-4">
              <ChessBoard
                onMove={handleMove}
                isWhiteTurn={isWhiteTurn}
                isFlipped={isFlipped}
                roomData={roomData}
                valuedNFTs={valuedNFTs}
                setValuedNFTs={setValuedNFTs}
                count={count}
                setDel={setDel}
              />
            </div>
            <div className="rounded-b-lg bg-gray-750 p-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 shadow-lg">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">{player1Account?.userName}</div>
                    <div className="text-sm text-purple-400">{player1Account?.rating}</div>
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
        <div className="flex flex-col space-y-4">
          <GameInfo moves={moves} />
        </div>
        <div className="bg-gray-800 rounded-xl p-4 -mt-20">
          <h2 className="text-xl font-bold text-blue-400 mb-2">Your NFTs</h2>
          {valuedNFTs.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {valuedNFTs.map((nft, index) => (
                <div key={index} className="p-2 bg-gray-700 rounded-lg text-center">
                  <p className="text-sm text-gray-300 font-medium">{nft.name}</p>
                  <p className="text-sm text-gray-400">Weight: {nft.weight.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">Value: {nft.value.toFixed(4)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No NFTs found.</p>
          )}
        </div>
      </div>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Game Over!</h2>
            <p className="text-lg text-gray-300">
              Your Game State = {calculateG().toFixed(4)}
            </p>
            <p className="text-lg text-gray-300">
              Game Threshold = {calculateT().toFixed(4)}
            </p>
            {
              calculateG() > calculateT() ? (
                <div className="flex w-full items-center justify-center gap-3 p-1">
                  <button className="p-2 bg-green-600 rounded-md border-none outline-none hover:bg-green-700">Improve your NFTs</button>
                  <button className="p-2 bg-blue-400 rounded-md border-none outline-none hover:bg-blue-500">Own Opponent's NFTs</button>
                </div>
              ) : (
                <span className="flex w-full text-lg text-red-400 font-semibold">
                  Sorry, you didn't cross the threshold! Better Luck Next Time!
                </span>
              )
            }

            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}