"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { ethers } from "ethers"
import abi from "@/app/collections/abi"

const NFT_CONTRACT_ADDRESS = "0x84D8779e6f128879F99Ea26a2829318867c87721"

const NEXT_PUBLIC_PINATA_API_URL = process.env.NEXT_PUBLIC_PINATA_API_URL
const NEXT_PUBLIC_PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY
const NEXT_PUBLIC_PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT

interface NFTMintingModalProps {
  isOpen: boolean
  onClose: () => void
  winner: "white" | "black" | null
  roomData: any
}

const chessPieces = [
  { name: "Knight", initialCount: 2, remaining: 2 },
  { name: "Bishop", initialCount: 2, remaining: 2 },
]

export default function NFTMintingModal({ isOpen, onClose, winner, roomData }: NFTMintingModalProps) {
  const [imageURL, setImageURL] = useState("")
  const [currentPiece, setCurrentPiece] = useState(chessPieces[0])
  const [mintingStatus, setMintingStatus] = useState("idle")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateAIChessPieceImage(currentPiece.name)
    }
  }, [isOpen, currentPiece])

  const generateAIChessPieceImage = async (pieceName: string) => {
    setIsGeneratingImage(true)
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ piece: pieceName }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setImageURL(data.imageURL)
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const generateMetadata = async (piece: { name: string }) => {
    const imageName = `${piece.name}.png`
    const imageUrl = `${NEXT_PUBLIC_PINATA_GATEWAY}/images/${imageName}`

    const metadata = {
      name: `Victory Chess NFT - ${piece.name}`,
      description: `A unique NFT commemorating your victory with the ${piece.name}.`,
      image: imageUrl,
      attributes: [
        { trait_type: "Piece", value: piece.name },
        { trait_type: "Victory", value: "Checkmate" },
      ],
    }

    const jsonString = JSON.stringify(metadata)
    const cid = await uploadMetadataToPinata(jsonString)
    return cid
  }

  const uploadMetadataToPinata = async (metadata: string) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: metadata,
    }

    try {
      const response = await fetch(`${NEXT_PUBLIC_PINATA_API_URL}/pinning/pinJSONToIPFS`, options)
      const json = await response.json()
      return json.IpfsHash
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const mintNFT = async () => {
    setMintingStatus("minting")
    try {
      const metadataHash = await generateMetadata(currentPiece)

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = provider.getSigner()

      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      const tx = await nftContract.createToken(metadataHash)
      await tx.wait()

      setMintingStatus("success")
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error minting NFT:", error)
      setMintingStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!` : "It's a Draw!"}
          </DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPiece.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-48 h-48 mb-4">
              {isGeneratingImage ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                </div>
              ) : (
                imageURL && (
                  <Image
                    src={imageURL || "/placeholder.svg"}
                    alt={currentPiece.name}
                    layout="fill"
                    objectFit="contain"
                  />
                )
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">{currentPiece.name}</h3>
            <div className="flex gap-4 mb-4">
              {chessPieces.map((piece) => (
                <Button
                  key={piece.name}
                  onClick={() => setCurrentPiece(piece)}
                  variant={currentPiece.name === piece.name ? "secondary" : "outline"}
                >
                  {piece.name}
                </Button>
              ))}
            </div>
            <Button
              onClick={mintNFT}
              disabled={isGeneratingImage || mintingStatus === "minting" || mintingStatus === "success"}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-full shadow-lg transition-all duration-300"
            >
              {mintingStatus === "minting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mintingStatus === "success" ? (
                "Minted!"
              ) : (
                "Mint Victory NFT"
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}