"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Tag, Check } from "lucide-react"

interface NFTAttribute {
  trait_type: string
  value: string
}

interface NFT {
  name: string
  attributes: NFTAttribute[]
  description: string
  image: string
  price: number
  timeLeft: string
  likes: number
  views: number
  tier: "legendary" | "epic" | "rare" | "common"
  tokenId: string
  ipfsHash: string
  nftContract: string
}

interface NFTModalProps {
  nft: NFT
  onClose: () => void
  isSelected: boolean
  onSelect: () => void
}

export function NFTModal({ nft, onClose, isSelected, onSelect }: NFTModalProps) {
  const tier = nft.attributes?.find((attr) => attr.trait_type === "Tier")?.value || "Common"
  const weight = nft.attributes?.find((attr) => attr.trait_type === "Weight")?.value || "Unknown"

  const tierColor =
    tier.toLowerCase() === "legendary"
      ? "from-orange-500 via-red-500 to-purple-600"
      : tier.toLowerCase() === "epic"
        ? "from-purple-500 via-blue-500 to-indigo-600"
        : tier.toLowerCase() === "rare"
          ? "from-blue-500 to-cyan-600"
          : "from-gray-600 to-gray-700"

  const imageUrl = nft.image.startsWith("http")
    ? nft.image
    : `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://aqua-past-reindeer-831.mypinata.cloud/ipfs/"}${nft.image}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-3xl w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-300"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={imageUrl || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              {nft.name}
            </h2>
            <p className="text-gray-400 mb-4">{nft.description || "A unique chess piece NFT."}</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Tier: {tier}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Weight: {weight}</span>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                className={`w-full py-3 ${
                  isSelected ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                } transition-colors duration-300`}
                onClick={onSelect}
              >
                {isSelected ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Selected
                  </>
                ) : (
                  "Select for Game"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full py-3 text-white border-blue-600 hover:bg-blue-600/20 transition-colors duration-300"
                onClick={() =>
                  window.open(`https://testnets.opensea.io/assets/amoy/${nft.nftContract}/${nft.tokenId}`, "_blank")
                }
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View on OpenSea
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

