"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Timer, Search, Loader2, PackageOpen } from "lucide-react"
import { NFTCard } from "./(components)/NFTCard"
import { NFTModal } from "./(components)/NFTModal"
import { useRouter } from "next/navigation"
import abi from "./abi"
import { useAccount } from "wagmi"

const CONTRACT_ADDRESS = "0x84D8779e6f128879F99Ea26a2829318867c87721"
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY

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

// Loading Component
function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
        <p className="text-blue-200 text-lg">Loading your NFT collection...</p>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState() {
  const router = useRouter()
  
  return (
    <div className="text-center py-20 px-4">
      <PackageOpen className="w-16 h-16 mx-auto text-blue-400 mb-4" />
      <h3 className="text-2xl font-semibold text-white mb-2">No NFTs Found</h3>
      <p className="text-blue-200 mb-6 max-w-md mx-auto">
        Your collection is empty. Start your journey by acquiring unique chess pieces from our marketplace.
      </p>
      <Button 
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
        onClick={() => router.push("/marketplace")}
      >
        Explore Marketplace
      </Button>
    </div>
  )
}

// Main NFT Marketplace Component
export default function NFTMarketplace() {
  const [filter, setFilter] = useState<string>("all")
  const [sort, setSort] = useState<string>("price-high")
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  const { address } = useAccount()
  const router = useRouter()

  useEffect(() => {
    async function fetchNFTs() {
      setIsLoading(true)
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
              const tokenId = tokenIds[index]
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
      setIsLoading(false)
    }

    fetchNFTs()
  }, [address])

  if (isLoading) return <Loading />

  const filteredNFTs = nfts.filter((nft) => {
    const matchesFilter =
      filter === "all" || nft.attributes?.find((attr) => attr.trait_type === "Tier")?.value.toLowerCase() === filter
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => 
  {
    if (sort === "price-high") return b.price - a.price
    if (sort === "price-low") return a.price - b.price
    if (sort === "recent") {
      const dateA = a.listingDate ? new Date(a.listingDate) : new Date(0)
      const dateB = b.listingDate ? new Date(b.listingDate) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    }
    return 0
  }
)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[60vh] overflow-hidden bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-blue-950/60 to-black" />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative container mx-auto px-4 h-full flex items-center"
        >
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600">
              Your NFT Collections
            </h1>
            <p className="text-lg sm:text-xl text-blue-200 mb-8 leading-relaxed">
              Collect, trade, and wield unique chess pieces in your journey to mastery. Each piece tells a story, each
              move shapes your legacy.
            </p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 rounded-full"
                onClick={() => router.push("/marketplace")}
              >
                Explore Marketplace
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="space-y-6 lg:space-y-0 lg:flex lg:items-center lg:justify-between mb-12"
        >
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-blue-950/50 border border-blue-800 rounded-full text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[160px] bg-blue-950/50 border-blue-800 rounded-full">
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
            </div>
          </div>
        </motion.div>

        {/* Add empty state */}
        {!nfts.length && !address && <EmptyState />}

        {/* NFT Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
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