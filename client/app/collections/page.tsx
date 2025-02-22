"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Timer, Search } from "lucide-react"
import { NFTCard } from "./(components)/NFTCard"
import { NFTModal } from "./(components)/NFTModal"
import abi from "./abi"
import { useAccount } from "wagmi"

const CONTRACT_ADDRESS = "0x84D8779e6f128879F99Ea26a2829318867c87721"
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

interface NFT {
  name: string
  description: string
  image: string
  attributes: { trait_type: string; value: string }[]
  tokenId: string
  price: number
  listingDate?: string
  timeLeft: string
  likes: number
  views: number
  tier: "legendary" | "epic" | "rare" | "common"
  ipfsHash: string
  nftContract: string
}

export default function NFTMarketplace() {
  const [filter, setFilter] = useState<string>("all")
  const [sort, setSort] = useState<string>("price-high")
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")

  const { address } = useAccount()

  useEffect(() => {
    async function fetchNFTs() {
      if (!window.ethereum || !address) {
        console.error("MetaMask is not installed or no address found.")
        return
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider)

      try {
        const [tokenIds, tokenURIs]: [ethers.BigNumber[], string[]] = await contract.getUserTokens(address)
        console.log(tokenURIs)

        const fetchedNFTs: NFT[] = (
          await Promise.all(
            tokenURIs.map(async (uri, index) => {
              const url = `${PINATA_GATEWAY}${uri}`
              const tokenId = tokenIds[index];
              try {
                const response = await fetch(url)
                if (!response.ok) {
                  throw new Error(`Failed to fetch metadata for URI: ${uri}`)
                }
                const metadata = await response.json()
                return {
                  ...metadata,
                  tokenId: tokenId.toString(),
                  ipfsHash: uri,
                  nftContract: CONTRACT_ADDRESS,
                }
              } catch (error) {
                console.error("Error fetching metadata:", error)
                return null
              }
            }),
          )
        ).filter((nft) => nft !== null) as NFT[]

        setNfts(fetchedNFTs)
      } catch (error) {
        console.error("Error fetching NFTs:", error)
      }
    }

    fetchNFTs()
  }, [address])

  const filteredNFTs = nfts.filter((nft) => {
    const matchesFilter =
      filter === "all" || nft.attributes?.find((attr) => attr.trait_type === "Tier")?.value.toLowerCase() === filter
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    if (sort === "price-high") return b.price - a.price
    if (sort === "price-low") return a.price - b.price
    if (sort === "recent") {
      const dateA = a.listingDate ? new Date(a.listingDate) : new Date(0) 
      const dateB = b.listingDate ? new Date(b.listingDate) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    }    
    return 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[50vh] overflow-hidden"
      >
        <div className="absolute inset-0 bg-blue-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative container mx-auto px-4 h-full flex items-center"
        >
          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Your NFT Collections
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Collect, trade, and wield unique chess pieces in your journey to mastery
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Explore NFTs
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-wrap gap-4 items-center justify-between mb-8"
        >
          <div className="flex gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-blue-950/50 border border-blue-800 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] bg-blue-950/50 border-blue-800 rounded-full">
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
              <SelectTrigger className="w-[180px] bg-blue-950/50 border-blue-800 rounded-full">
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
            <Button variant="outline" className="border-blue-800 hover:bg-blue-800 rounded-full text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button variant="outline" className="border-blue-800 hover:bg-blue-800 rounded-full text-black">
              <Timer className="w-4 h-4 mr-2" />
              Live Auctions
            </Button>
          </div>
        </motion.div>

        {/* NFT Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {sortedNFTs.map((nft) => (
              <NFTCard key={nft.tokenId} nft={nft} onClick={() => setSelectedNFT(nft)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* NFT Modal */}
      <AnimatePresence>
        {selectedNFT && <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />}
      </AnimatePresence>
    </div>
  )
}