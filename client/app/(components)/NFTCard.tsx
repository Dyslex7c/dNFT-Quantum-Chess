import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Shield, Sword, Timer, Eye, Heart, Coins } from "lucide-react"

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

interface NFTCardProps {
  nft: NFT;
  onClick: () => void;
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const [colorOpacity, setColorOpacity] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setColorOpacity((prev) => (prev === 0 ? 0.7 : 0));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getTierFromMetadata = () => {
    const tierAttribute = nftMetadata?.attributes?.find(
      attr => attr.trait_type.toLowerCase() === 'tier'
    );
    return (tierAttribute?.value?.toLowerCase() || 'common') as "legendary" | "epic" | "rare" | "common";
  };

  const tier = getTierFromMetadata();

  const tierColor =
    tier === "legendary"
      ? "from-orange-500 via-red-500 to-black"
      : tier === "epic"
        ? "from-purple-500 via-blue-500 to-indigo-600"
        : tier === "rare"
          ? "from-blue-500 to-cyan-600"
          : "from-gray-600 to-gray-700";

  const weight = nftMetadata?.attributes?.find(
    attr => attr.trait_type === 'Weight'
  )?.value || 'N/A';

  const getTimeLeft = () => {
    const timeLeftAttr = nftMetadata?.attributes?.find(
      attr => attr.trait_type === 'Time Left'
    );
    return timeLeftAttr?.value || '24h left';
  };

  const getStats = () => {
    const likes = nftMetadata?.attributes?.find(
      attr => attr.trait_type === 'Likes'
    )?.value || '0';
    const views = nftMetadata?.attributes?.find(
      attr => attr.trait_type === 'Views'
    )?.value || '0';
    return { likes, views };
  };

  const stats = getStats();

  const getImageUrl = () => {
    const imageUrl = nftMetadata?.image;
    if (!imageUrl) return "/placeholder.svg";
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) {
      return imageUrl;
    }
    const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
    return `${PINATA_GATEWAY}${imageUrl}`;
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
                alt={nftMetadata?.name || `NFT #${nft.tokenId}`}
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
              {nftMetadata?.name || `NFT #${nft.tokenId}`}
            </h3>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-400" />
                <span className="font-mono">{nft.price} ETH</span>
              </div>
              <div className="text-sm text-gray-400">
                Weight: {weight}
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
