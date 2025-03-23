import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Shield, Sword, Timer, Eye, Heart, Coins } from "lucide-react"

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

interface NFTCardProps {
  nft: NFT;
  onClick: () => void;
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const [colorOpacity, setColorOpacity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorOpacity((prev) => (prev === 0 ? 0.7 : 0));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getTierFromTrait = () => {
    const traitLower = nft.trait.toLowerCase();
    
    if (traitLower.includes("legendary")) return "legendary";
    if (traitLower.includes("epic")) return "epic";
    if (traitLower.includes("rare")) return "rare";
    return "common";
  };

  const tier = getTierFromTrait();

  const tierColor =
    tier === "legendary"
      ? "from-orange-500 via-red-500 to-black"
      : tier === "epic"
        ? "from-purple-500 via-blue-500 to-indigo-600"
        : tier === "rare"
          ? "from-blue-500 to-cyan-600"
          : "from-gray-600 to-gray-700";

  // Calculate time left (for display purposes only)
  const getTimeLeft = () => {
    return '24h left'; // Placeholder, you would compute this based on your contract logic
  };

  // Mock statistics for UI display
  const getStats = () => {
    // In a real implementation, these might come from your contract or a separate tracking system
    return { 
      likes: Math.floor(nft.weight / 10), 
      views: Math.floor(nft.weight * 2) 
    };
  };

  const stats = getStats();

  const getImageUrl = () => {
    const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
    if (!nft.image_ipfs_hash) return "/placeholder.svg";
    return `${PINATA_GATEWAY}${nft.image_ipfs_hash}`;
  };

  // Format price to display properly
  const formatPrice = (price: number) => {
    return (price / 100000000).toFixed(6); // Convert Aptos octas to APT
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group rounded-xl overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-[1px] bg-gradient-to-br ${tierColor}`}>
        <div className="bg-gray-900 p-4 h-full relative">
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${tierColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: colorOpacity }}
            transition={{ duration: 1.5 }}
          />
          <div className="relative z-10">
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
              <Image
                src={getImageUrl()}
                alt={nft.name || `NFT #${nft.token_id}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              <div className={`absolute top-2 right-2 px-3 py-1 rounded-full
                ${tier === "legendary" ? "bg-orange-500"
                  : tier === "epic" ? "bg-purple-500"
                  : tier === "rare" ? "bg-blue-500"
                  : "bg-gray-500"} flex items-center gap-1`}>
                {tier === "legendary" ? <Crown className="w-4 h-4" />
                  : tier === "epic" ? <Sparkles className="w-4 h-4" />
                  : tier === "rare" ? <Shield className="w-4 h-4" />
                  : <Sword className="w-4 h-4" />}
                <span className="text-xs font-semibold capitalize">{tier}</span>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2">
              {nft.name || `NFT #${nft.token_id}`}
            </h3>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-400" />
                <span className="font-mono">{formatPrice(nft.price)} APT</span>
              </div>
              <div className="text-sm text-gray-400">
                Weight: {nft.weight}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Timer className="w-4 h-4" />
              {getTimeLeft()}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {stats.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {stats.views}
                </span>
              </div>
              <Button size="sm" className={`
                ${tier === "legendary" ? "bg-orange-600 hover:bg-orange-700"
                  : tier === "epic" ? "bg-purple-600 hover:bg-purple-700"
                  : tier === "rare" ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"}`}>
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}