"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NFTCard } from "../(components)/NFTCard";
import { NFTModal } from "../(components)/NFTModal";
import { useRouter } from "next/navigation";
import { createMarketSale, fetchMarketItems } from "@/utils/market";

// Type definition aligned with the Move contract structure
type NFT = {
  itemId: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  owner: string;
  price: string;
  sold: boolean;
  name: string;
  trait: string;
  weight: number;
  imageIpfsHash: string;
  tier: string; // Derived from trait for frontend categorization
};

export default function NFTMarketplace() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("price-high");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Contract addresses
  const MARKET_ADDRESS = "0x9b29080e47a564c1d256ed74663f2ad4bf4b8e8971cd308004038479399464df";
  
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  // Map trait to tier for UI display
  const mapTraitToTier = (trait: string): string => {
    const lowerTrait = trait.toLowerCase().trim();
    if (lowerTrait.includes("legendary")) return "legendary";
    if (lowerTrait.includes("epic")) return "epic";
    if (lowerTrait.includes("rare")) return "rare";
    return "common";
  };

  const loadNFTs = async () => {
    try {
      setLoading(true);
      
      // Fetch market items from your Aptos contract
      const items = await fetchMarketItems(MARKET_ADDRESS);
      console.log("Raw fetched NFTs:", items);
      
      // Map Move contract fields to frontend model
      const processedItems: NFT[] = items.map((item: any) => {
        // Map the trait to a tier for UI filtering
        const tier = mapTraitToTier(item.trait);
        
        return {
          itemId: item.item_id,
          nftContract: item.nft_contract,
          tokenId: item.token_id,
          seller: item.seller,
          owner: item.owner,
          price: item.price.toString(),
          sold: item.sold,
          name: item.name,
          trait: item.trait,
          weight: item.weight,
          imageIpfsHash: item.image_ipfs_hash,
          tier: tier
        };
      });

      setNfts(processedItems);
      console.log("Final NFTs after processing:", processedItems);
    } catch (error) {
      console.error("Failed to load NFTs:", error);
      alert("Failed to load NFTs. Please check your wallet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Filter NFTs based on tier (derived from trait)
  const filteredNFTs = nfts.filter((nft) => {
    console.log(`Filtering: NFT Tier = ${nft.tier}, Selected Filter = ${filter}`);
    return filter === "all" || nft.tier === filter;
  });

  // Sort NFTs based on selected criteria
  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sort) {
      case "price-high":
        return Number.parseFloat(b.price) - Number.parseFloat(a.price);
      case "price-low":
        return Number.parseFloat(a.price) - Number.parseFloat(b.price);
      case "recent":
        return b.itemId - a.itemId;
      default:
        return 0;
    }
  });

  // Handle NFT purchase using Aptos contract
  const handleBuyNFT = async (nft: NFT) => {
    try {
      setLoading(true);
      
      // Call create_market_sale function in Move contract
      const result = await createMarketSale(
        MARKET_ADDRESS,
        nft.nftContract,
        nft.itemId
      );
      
      if (result.success) {
        alert("NFT purchased successfully!");
        await loadNFTs(); 
        setSelectedNFT(null);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert(error instanceof Error ? error.message : "Failed to purchase NFT. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : sortedNFTs.length > 0 ? (
              sortedNFTs.map((nft) => (
                <NFTCard
                  key={nft.itemId}
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