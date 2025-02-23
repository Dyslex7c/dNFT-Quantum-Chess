import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Clock, User, Tag, Weight } from "lucide-react"
import { createMarketSale, fetchMarketItems } from "@/utils/market"

// Updated NFT interface to match the marketplace data structure
interface NFT {
  id: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  owner: string;
  price: string;
  sold: boolean;
  ipfsHash: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

interface NFTModalProps {
  nft: NFT;
  onClose: () => void;
  onBuy: () => void;
  loading?: boolean;
}

export function NFTModal({ nft, onClose, onBuy, loading = false }: NFTModalProps) {
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
        if (!PINATA_GATEWAY) {
          throw new Error("Pinata gateway URL not configured");
        }
        const response = await fetch(`${PINATA_GATEWAY}${nft.ipfsHash}`);
        if (response.ok) {
          const data = await response.json();
          setNftMetadata(data);
        }
      } catch (error) {
        console.error("Error fetching NFT metadata:", error);
      }
    };

    fetchMetadata();
  }, [nft.ipfsHash]);

  // Helper function to ensure the image URL is valid for Next.js Image
  const getImageUrl = () => {
    const imageUrl = nftMetadata?.image;
    if (!imageUrl) return "/placeholder.svg";
    // If the image URL already starts with "http" or "/", return it as-is.
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) {
      return imageUrl;
    }
    // Otherwise, assume it's an IPFS hash and prepend the gateway URL.
    const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
    return `${PINATA_GATEWAY}${imageUrl}`;
  };

  const weight = nftMetadata?.attributes?.find(
    (attr) => attr.trait_type === 'Weight'
  )?.value || 'N/A';

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
                alt={nftMetadata?.name || `NFT #${nft.tokenId}`} 
                fill 
                className="object-cover" 
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-bold mb-2">
              {nftMetadata?.name || `NFT #${nft.tokenId}`}
            </h2>
            <p className="text-gray-400 mb-4">
              {nftMetadata?.description || "A unique chess piece NFT with special powers and abilities."}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Price: {nft.price} ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Weight: {weight}</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Seller: {nft.seller}</span>
              </div> */}
              {/* <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Owner: {nft.owner}</span>
              </div> */}
            </div>
            <div className="space-y-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={onBuy}
                disabled={loading}
              >
                {loading ? "Processing..." : "Buy Now"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-black hover:text-blue-600"
                onClick={() => window.open(`https://testnets.opensea.io/assets/amoy/${nft.nftContract}/${nft.tokenId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on OpenSea
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
