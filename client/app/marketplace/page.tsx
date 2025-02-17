"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Timer } from "lucide-react"
import { NFTCard } from "../(components)/NFTCard"
import { NFTModal } from "../(components)/NFTModal"
import { useRouter } from "next/navigation"

type NFT = {
  id: number;
  name: string
  description?: string
  image: string
  price: number
  timeLeft: string
  likes: number
  views: number
  tier: "legendary" | "epic" | "rare" | "common"
};

const nfts = [
  {
    id: 1,
    name: "Dragon Slayer Knight",
    tier: "legendary" as "legendary",
    price: 2.5,
    timeLeft: "2h 15m",
    image: "/knight2.jpeg?height=400&width=400",
    likes: 234,
    views: 1502,
  },
  {
    id: 2,
    name: "Mystic Queen",
    tier: "epic" as "epic",
    price: 1.8,
    timeLeft: "5h 30m",
    image: "/placeholder.svg?height=400&width=400",
    likes: 189,
    views: 1205,
  },
  {
    id: 3,
    name: "Royal Bishop",
    tier: "rare" as "rare",
    price: 0.8,
    timeLeft: "1d 3h",
    image: "/placeholder.svg?height=400&width=400",
    likes: 145,
    views: 892,
  },
  {
    id: 4,
    name: "Loyal Pawn",
    tier: "common" as "common",
    price: 0.2,
    timeLeft: "2d 12h",
    image: "/placeholder.svg?height=400&width=400",
    likes: 67,
    views: 445,
  },
]

export default function NFTMarketplace() {
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("price-high")
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
              Ethereal Chess NFT Marketplace
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Collect, trade, and wield unique chess pieces in your journey to mastery
            </p>
            <Button onClick={() => router.push("/collections")} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Explore Collection
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] bg-blue-950/50 border-blue-800">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="legendary">Legendary</SelectItem>
                <SelectItem value="epic">Epic</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="common">Common</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px] bg-blue-950/50 border-blue-800">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="recent">Recently Listed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-blue-800 text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button variant="outline" className="border-blue-800 text-black">
              <Timer className="w-4 h-4 mr-2" />
              Live Auctions
            </Button>
          </div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {nfts.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onClick={() => setSelectedNFT(nft)} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* NFT Modal */}
      <AnimatePresence>
        {selectedNFT && <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />}
      </AnimatePresence>
    </div>
  )
}

