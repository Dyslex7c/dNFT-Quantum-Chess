"use client"

import React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Eye, Heart } from "lucide-react"

interface NFTProps {
  nft: {
    name: string
    image: string
    price: number
    tier: "legendary" | "epic" | "rare" | "common"
    likes: number
    views: number
    timeLeft?: string
    weight: number
    trait: string
  }
  onClick: () => void
}

const getTierColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case "legendary":
      return "bg-amber-500 hover:bg-amber-600"
    case "epic":
      return "bg-purple-500 hover:bg-purple-600"
    case "rare":
      return "bg-blue-500 hover:bg-blue-600"
    default:
      return "bg-green-500 hover:bg-green-600"
  }
}

export function NFTCard({ nft, onClick }: NFTProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="h-full"
      onClick={onClick}
    >
      <Card className="h-full overflow-hidden bg-blue-950/30 border-blue-800/50 transition-all hover:border-blue-600 cursor-pointer group">
        <div className="relative aspect-square overflow-hidden bg-blue-900/30">
          <div className="absolute top-2 right-2 z-10">
            <Badge className={`uppercase ${getTierColor(nft.tier)}`}>{nft.tier}</Badge>
          </div>
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              // Fallback image if the NFT image fails to load
              (e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=400"
            }}
          />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-white line-clamp-1">{nft.name}</h3>
          </div>
          
          <div className="flex justify-between text-xs text-blue-300">
            <div className="flex items-center gap-1">
              <p>Trait: {nft.trait}</p>
            </div>
            <div className="flex items-center gap-1">
              <p>Weight: {nft.weight}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-blue-300">{nft.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-blue-300">{nft.views}</span>
              </div>
            </div>
            {nft.price > 0 && (
              <div className="text-white font-medium">
                <span className="text-sm">{nft.price} APT</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}