"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Shield, Sword, Coins } from "lucide-react"

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY

interface NFTAttribute {
  trait_type: string
  value: string
}

interface NFT {
  name: string
  attributes?: NFTAttribute[]
  description: string
  image: string
  price: number
  timeLeft: string
  likes: number
  views: number
  tier: "legendary" | "epic" | "rare" | "common"
}

interface NFTCardProps {
  nft: NFT
  onClick: () => void
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Extracting attributes
  const tier = nft.attributes?.find((attr) => attr.trait_type === "Tier")?.value?.toLowerCase() || "common"
  const weight = nft.attributes?.find((attr) => attr.trait_type === "Weight")?.value || "Unknown"

  const tierColor =
    tier === "legendary"
      ? "from-orange-500 via-red-500 to-purple-600"
      : tier === "epic"
        ? "from-purple-500 via-blue-500 to-indigo-600"
        : tier === "rare"
          ? "from-blue-500 to-cyan-600"
          : "from-gray-600 to-gray-700"

  // Compute the image URL
  const imageUrl =
    nft.image.startsWith("http")
      ? nft.image
      : `${PINATA_GATEWAY || "https://aqua-past-reindeer-831.mypinata.cloud/ipfs/"}${nft.image}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={`relative group rounded-xl overflow-hidden cursor-pointer`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`p-[2px] bg-gradient-to-br ${tierColor}`}>
        <div className="bg-gray-900 p-4 h-full relative rounded-xl overflow-hidden">
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${tierColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.2 : 0 }}
            transition={{ duration: 0.3 }}
          />
          <div className="relative z-10">
            {/* Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
              <Image
                src={imageUrl}
                alt={nft.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {/* Tier Badge */}
              <div
                className={`absolute top-2 right-2 px-3 py-1 rounded-full ${
                  tier === "legendary"
                    ? "bg-orange-500"
                    : tier === "epic"
                      ? "bg-purple-500"
                      : tier === "rare"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                } flex items-center gap-1`}
              >
                {tier === "legendary" ? (
                  <Crown className="w-4 h-4" />
                ) : tier === "epic" ? (
                  <Sparkles className="w-4 h-4" />
                ) : tier === "rare" ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <Sword className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold capitalize">{tier}</span>
              </div>
            </div>

            {/* Info */}
            <h3 className="text-lg font-bold mb-2">{nft.name}</h3>
            <p className="text-gray-400 text-sm mb-4">Weight: {weight}</p>

            <div className="flex justify-between items-center">
              <Button
                size="sm"
                className={`w-full ${
                  tier === "legendary"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : tier === "epic"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : tier === "rare"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-600 hover:bg-gray-700"
                } transition-colors duration-300`}
              >
                <Coins className="w-4 h-4 mr-2" />
                Sell NFT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
