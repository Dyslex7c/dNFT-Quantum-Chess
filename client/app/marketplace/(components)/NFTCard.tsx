"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Shield, Sword, Timer, Eye, Heart, Coins } from "lucide-react"

export function NFTCard({ nft, onClick }) {
  const [colorOpacity, setColorOpacity] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setColorOpacity((prev) => (prev === 0 ? 0.7 : 0))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const tierColor =
    nft.tier === "legendary"
      ? "from-orange-500 via-red-500 to-black"
      : nft.tier === "epic"
        ? "from-purple-500 via-blue-500 to-indigo-600"
        : nft.tier === "rare"
          ? "from-blue-500 to-cyan-600"
          : "from-gray-600 to-gray-700"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-xl overflow-hidden cursor-pointer`}
      onClick={onClick}
    >
      <div className="p-[1px] bg-gradient-to-br ${tierColor}">
        <div className="bg-gray-900 p-4 h-full relative">
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${tierColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: colorOpacity }}
            transition={{ duration: 1.5 }}
          />
          <div className="relative z-10">
            {/* Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
              <Image
                src={nft.image || "/placeholder.svg"}
                alt={nft.name}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              {/* Tier Badge */}
              <div
                className={`
                absolute top-2 right-2 px-3 py-1 rounded-full
                ${
                  nft.tier === "legendary"
                    ? "bg-orange-500"
                    : nft.tier === "epic"
                      ? "bg-purple-500"
                      : nft.tier === "rare"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                }
                flex items-center gap-1
              `}
              >
                {nft.tier === "legendary" ? (
                  <Crown className="w-4 h-4" />
                ) : nft.tier === "epic" ? (
                  <Sparkles className="w-4 h-4" />
                ) : nft.tier === "rare" ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <Sword className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold capitalize">{nft.tier}</span>
              </div>
            </div>

            {/* Info */}
            <h3 className="text-lg font-bold mb-2">{nft.name}</h3>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-400" />
                <span className="font-mono">{nft.price} ETH</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Timer className="w-4 h-4" />
                {nft.timeLeft}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {nft.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {nft.views}
                </span>
              </div>
              <Button
                size="sm"
                className={`
                  ${
                    nft.tier === "legendary"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : nft.tier === "epic"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : nft.tier === "rare"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-600 hover:bg-gray-700"
                  }
                `}
              >
                Place Bid
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

