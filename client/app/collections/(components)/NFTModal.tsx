"use client"

import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Heart, Clock, Eye, Share2 } from "lucide-react"

interface NFTModalProps {
  nft: {
    name: string
    description: string
    image: string
    attributes: { trait_type: string; value: string }[]
    tokenId: string
    price: number
    timeLeft?: string
    tier: "legendary" | "epic" | "rare" | "common"
    weight: number
    trait: string
  }
  onClose: () => void
}

const getTierColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case "legendary":
      return "bg-amber-500"
    case "epic":
      return "bg-purple-500"
    case "rare":
      return "bg-blue-500"
    default:
      return "bg-green-500"
  }
}

export function NFTModal({ nft, onClose }: NFTModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gradient-to-b from-blue-950 to-black border border-blue-800/50 rounded-2xl max-w-4xl w-full mx-auto overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 relative">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-square">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback image if the NFT image fails to load
                  (e.target as HTMLImageElement).src = "/placeholder.svg?height=600&width=600"
                }}
              />
            </div>
          </div>
          <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl lg:text-3xl font-bold text-white">{nft.name}</h2>
              <Badge className={`uppercase ${getTierColor(nft.tier)}`}>{nft.tier}</Badge>
            </div>
            
            <p className="text-blue-300 mt-4">{nft.description}</p>
            
            <div className="border-t border-blue-800/30 my-6"></div>
            
            <div className="space-y-4 flex-grow">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-400 mb-1">Token ID</p>
                    <p className="text-sm text-white font-mono truncate">{nft.tokenId}</p>
                  </div>
                  <div className="bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-400 mb-1">Trait</p>
                    <p className="text-sm text-white">{nft.trait}</p>
                  </div>
                  <div className="bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-400 mb-1">Weight</p>
                    <p className="text-sm text-white">{nft.weight}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {nft.attributes.map((attr, index) => (
                    <div key={index} className="bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-400 mb-1">{attr.trait_type}</p>
                      <p className="text-sm text-white">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t border-blue-800/30 my-6"></div>
            
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                {nft.price > 0 ? (
                  <>
                    <p className="text-xs text-blue-400">Current price</p>
                    <p className="text-2xl font-bold text-white">{nft.price} APT</p>
                  </>
                ) : (
                  <p className="text-sm text-blue-200">Not for sale</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-blue-600 text-blue-400">
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
                {nft.price > 0 && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Buy now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}