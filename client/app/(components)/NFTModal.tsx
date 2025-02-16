import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, ExternalLink, Clock, User, Tag } from "lucide-react"

export function NFTModal({ nft, onClose }) {
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
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={nft.image || "/placeholder.svg"} alt={nft.name} fill className="object-cover" />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-bold mb-2">{nft.name}</h2>
            <p className="text-gray-400 mb-4">
              {nft.description || "A unique chess piece NFT with special powers and abilities."}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Price: {nft.price} ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Time Left: {nft.timeLeft}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Creator: CryptoChessMaster</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Place Bid</Button>
              <Button variant="outline" className="w-full text-black">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on OpenSea
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

