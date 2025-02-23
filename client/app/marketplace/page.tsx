"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NFTCard } from "../(components)/NFTCard";
import { NFTModal } from "../(components)/NFTModal";
import { useRouter } from "next/navigation";
import { fetchMarketItems, createMarketSale } from "@/utils/market";

type NFT = {
  id: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  owner: string;
  price: string;
  sold: boolean;
  ipfsHash: string;
  name: string;
  image: string;
  timeLeft: string;
  likes: number;
  tier: string;
};

export default function NFTMarketplace() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("price-high");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const items = await fetchMarketItems();
      console.log("Raw fetched NFTs:", items);

      // Normalize tier values
      const itemsWithNormalizedTier: NFT[] = items.map((item: NFT) => {
        const normalizedTier = item.tier ? item.tier.toLowerCase().trim() : "common";
        console.log(`NFT ID: ${item.id}, Original Tier: ${item.tier}, Normalized Tier: ${normalizedTier}`);
        return {
          ...item,
          tier: normalizedTier,
        };
      });

      setNfts(itemsWithNormalizedTier);
      console.log("Final NFTs after processing:", itemsWithNormalizedTier);
    } catch (error) {
      alert("Failed to load NFTs. Please check your wallet connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = nfts.filter((nft) => {
    console.log(`Filtering: NFT Tier = ${nft.tier}, Selected Filter = ${filter}`);
    return filter === "all" || nft.tier.toLowerCase() === filter.toLowerCase();
  });

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sort) {
      case "price-high":
        return Number.parseFloat(b.price) - Number.parseFloat(a.price);
      case "price-low":
        return Number.parseFloat(a.price) - Number.parseFloat(b.price);
      case "recent":
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const handleBuyNFT = async (nft: NFT) => {
    try {
      setLoading(true);
      const result = await createMarketSale(nft.id, nft.price);
      
      if (result.success) {
        alert("NFT purchased successfully!");
        await loadNFTs(); // Refresh the NFT list
        setSelectedNFT(null); // Close the modal
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to purchase NFT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
              Ethereal Chess NFT Marketplace
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Collect, trade, and wield unique chess pieces in your journey to mastery
            </p>
            <Button
              onClick={() => router.push("/collections")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              Explore Collection
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="flex gap-4">
            <Select defaultValue={filter} onValueChange={(value) => {
              console.log("Filter changed to:", value);
              setFilter(value);
            }}>
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
            <Select defaultValue={sort} onValueChange={setSort}>
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
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : sortedNFTs.length > 0 ? (
              sortedNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onClick={() => setSelectedNFT(nft)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                No NFTs found matching your criteria
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NFT Modal */}
      <AnimatePresence>
        {selectedNFT && (
          <NFTModal
            nft={selectedNFT}
            onClose={() => setSelectedNFT(null)}
            onBuy={() => handleBuyNFT(selectedNFT)}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
