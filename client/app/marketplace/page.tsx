"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Timer } from "lucide-react"
import { NFTCard } from "../(components)/NFTCard"
import { NFTModal } from "../(components)/NFTModal"
import { useRouter } from "next/navigation"
import { fetchMarketItems, createMarketSale } from "@/utils/market"

type NFT = {
  id: number
  nftContract: string
  tokenId: number
  seller: string
  owner: string
  price: string
  sold: boolean
  ipfsHash: string
}

export default function NFTMarketplace() {
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("price-high")
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [nfts, setNfts] = useState<NFT[]>([])

  const router = useRouter()

  useEffect(() => {
    const loadNFTs = async () => {
      const items = await fetchMarketItems()
      setNfts(items)
    }
    loadNFTs()
  }, [])
  console.log(nfts);

  // Filter NFTs based on tier (you may need to adjust this based on your actual data)
  const filteredNFTs = nfts.filter((nft) => {
    return filter === "all" || nft.ipfsHash.includes(filter.toLowerCase())
  })

  // Sort filtered NFTs
  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sort) {
      case "price-high":
        return Number.parseFloat(b.price) - Number.parseFloat(a.price)
      case "price-low":
        return Number.parseFloat(a.price) - Number.parseFloat(b.price)
      case "recent":
        return b.id - a.id
      default:
        return 0
    }
  })

  const handleBuyNFT = async (nft: NFT) => {
    const success = await createMarketSale(nft.id, nft.price)
    if (success) {
      alert("NFT purchased successfully!")
      // Refresh the NFT list
      const items = await fetchMarketItems()
      setNfts(items)
    } else {
      alert("Failed to purchase NFT. Please try again.")
    }
  }

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
            {sortedNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onClick={() => setSelectedNFT(nft)} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* NFT Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} onBuy={() => handleBuyNFT(selectedNFT)} />
        )}
      </AnimatePresence>
    </div>
  )
}

