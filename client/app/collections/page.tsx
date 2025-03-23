"use client"

import { useState, useEffect } from "react"
import { Provider, Network, AptosClient, Types, AptosAccount } from "aptos"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Timer, Search, Loader2, PackageOpen } from "lucide-react"
import { NFTCard } from "./(components)/NFTCard"
import { NFTModal } from "./(components)/NFTModal"
import { useRouter } from "next/navigation"

// Aptos configuration
const NFT_MODULE_ADDRESS = "0x9b29080e47a564c1d256ed74663f2ad4bf4b8e8971cd308004038479399464df"
const MARKET_MODULE_ADDRESS = "0x9b29080e47a564c1d256ed74663f2ad4bf4b8e8971cd308004038479399464df"
const NETWORK = Network.TESTNET
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1"
const FAUCET_URL = "https://faucet.testnet.aptoslabs.com"
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

// NFT structure that matches our DynamicNFT implementation
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
  weight: number
  trait: string
}

// Market item structure that matches our DynamicNFTMarket implementation
interface MarketItem {
  itemId: string
  nftContract: string
  tokenId: string
  seller: string
  owner: string
  price: string
  sold: boolean
  name: string
  trait: string
  weight: number
  imageIpfsHash: string
}

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

export default function NFTCollection() {
  const [filter, setFilter] = useState<string>("all")
  const [sort, setSort] = useState<string>("price-high")
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [client, setClient] = useState<AptosClient | null>(null)

  const router = useRouter()

  // Initialize Aptos client
  useEffect(() => {
    const initializeClient = async () => {
      const newClient = new AptosClient(NODE_URL)
      setClient(newClient)

      // Check if Petra wallet is installed
      if (window.aptos) {
        try {
          const response = await window.aptos.connect()
          setWalletAddress(response.address)
        } catch (error) {
          console.error("Failed to connect to wallet:", error)
        }
      } else {
        console.log("Petra wallet not found")
      }
    }

    initializeClient()
  }, [])

  // Fetch NFTs when wallet is connected
  useEffect(() => {
    if (client && walletAddress) {
      fetchUserNFTs()
    } else if (client) {
      setIsLoading(false)
    }
  }, [client, walletAddress])

  async function fetchUserNFTs() {
    setIsLoading(true)
    
    if (!client || !walletAddress) {
      console.error("Client or wallet address not available")
      setIsLoading(false)
      return
    }

    try {
      // Call view function to get user tokens
      const payload = {
        function: `${NFT_MODULE_ADDRESS}::DynamicNFT::get_user_tokens`,
        type_arguments: [],
        arguments: [walletAddress]
      }

      const response = await client.view(payload)
      
      if (response && Array.isArray(response) && response.length >= 2) {
        const tokenIds = response[0] as string[]
        const metadata = response[1] as any[]

        // Map the response to NFT objects
        const fetchedNFTs: NFT[] = tokenIds.map((tokenId, index) => {
          const tokenMetadata = metadata[index]
          
          // For simplicity, let's assume we store IPFS hash in the image_ipfs_hash field
          const ipfsHash = tokenMetadata.image_ipfs_hash
          
          // Extract tier from traits if available, or default to "common"
          const tier = "common" // This would be extracted from metadata in a real implementation
          
          return {
            name: tokenMetadata.name,
            description: `A unique chess piece - ${tokenMetadata.name}`,
            image: `${IPFS_GATEWAY}${ipfsHash}`,
            attributes: [
              { trait_type: "Tier", value: tier },
              { trait_type: "Trait", value: tokenMetadata.trait },
              { trait_type: "Weight", value: tokenMetadata.weight.toString() }
            ],
            tokenId: tokenId,
            price: 0, // Not for sale if in user's collection
            timeLeft: "",
            likes: 0,
            views: 0,
            tier: tier as any,
            ipfsHash: ipfsHash,
            nftContract: NFT_MODULE_ADDRESS,
            weight: tokenMetadata.weight,
            trait: tokenMetadata.trait
          }
        })

        setNfts(fetchedNFTs)
      } else {
        console.error("Unexpected response format:", response)
        setNfts([])
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error)
      setNfts([])
    }
    
    setIsLoading(false)
  }

  // Connect wallet function
  async function connectWallet() {
    if (window.aptos) {
      try {
        const response = await window.aptos.connect()
        setWalletAddress(response.address)
      } catch (error) {
        console.error("Failed to connect to wallet:", error)
      }
    } else {
      console.log("Petra wallet not found")
    }
  }

  if (isLoading) return <Loading />

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
              {!walletAddress && (
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 rounded-full"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              )}
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
        {!nfts.length && !walletAddress && <EmptyState />}
        {!nfts.length && walletAddress && (
          <div className="text-center py-20 px-4">
            <PackageOpen className="w-16 h-16 mx-auto text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No NFTs Found</h3>
            <p className="text-blue-200 mb-6 max-w-md mx-auto">
              You don't have any NFTs in your collection yet. Visit the marketplace to discover unique chess pieces.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              onClick={() => router.push("/marketplace")}
            >
              Explore Marketplace
            </Button>
          </div>
        )}
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
      <AnimatePresence>
        {selectedNFT && <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />}
      </AnimatePresence>
    </div>
  )
}

// Add TypeScript declaration for the Petra wallet
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>
      isConnected: () => Promise<boolean>
      account: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>
    }
  }
}