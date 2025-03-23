import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Weight, Tag } from "lucide-react"
import { createMarketSale } from "@/utils/market"

interface NFT {
  item_id: number;
  nft_contract: string;
  token_id: number;
  seller: string;
  owner: string;
  price: number;
  sold: boolean;
  name: string;
  trait: string;
  weight: number;
  image_ipfs_hash: string;
}

interface NFTModalProps {
  nft: NFT;
  onClose: () => void;
  onBuy: () => void;
  marketAddress: string;
  loading?: boolean;
}

export function NFTModal({ nft, onClose, onBuy, marketAddress, loading = false }: NFTModalProps) {
  // Format price to display properly
  const formatPrice = (price: number) => {
    return (price / 100000000).toFixed(6); // Convert Aptos octas to APT
  };

  const getImageUrl = () => {
    const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
    if (!nft.image_ipfs_hash) return "/placeholder.svg";
    return `${PINATA_GATEWAY}${nft.image_ipfs_hash}`;
  };

  const handleBuy = async () => {
    try {
      // Call the buy function and pass the result to onBuy
      const result = await createMarketSale(
        marketAddress,
        nft.nft_contract,
        nft.item_id
      );
      
      if (result.success) {
        onBuy();
      } else {
        console.error("Failed to buy NFT:", result.error);
        // You would implement error handling here
      }
    } catch (error) {
      console.error("Error buying NFT:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white" 
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image 
                src={getImageUrl()} 
                alt={nft.name || `NFT #${nft.token_id}`} 
                fill 
                className="object-cover" 
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-bold mb-2">
              {nft.name || `NFT #${nft.token_id}`}
            </h2>
            <p className="text-gray-400 mb-4">
              A {nft.trait.toLowerCase()} chess piece NFT with special powers and abilities.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Price: {formatPrice(nft.price)} APT</span>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Weight: {nft.weight}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleBuy}
                disabled={loading}
              >
                {loading ? "Processing..." : "Buy Now"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-gray-400 hover:text-blue-600"
                onClick={() => window.open(`https://explorer.aptoslabs.com/account/${nft.nft_contract}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Aptos Explorer
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}