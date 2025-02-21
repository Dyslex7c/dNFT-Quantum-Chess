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

const chessPieces = [
  { name: "Pawn", count: 8 },
  { name: "Rook", count: 2 },
  { name: "Knight", count: 2 },
  { name: "Bishop", count: 2 },
  { name: "Queen", count: 1 },
  { name: "King", count: 1 },
]

export default function NFTMintingModal() {
  const [isOpen, setIsOpen] = useState(true)
  const [imageURL, setImageURL] = useState("")
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0)
  const [mintingStatus, setMintingStatus] = useState("idle")
  const [mintedCount, setMintedCount] = useState(0)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  useEffect(() => {
    generateAIChessPieceImage(chessPieces[currentPieceIndex].name)
  }, [currentPieceIndex])

  useEffect(() => {
    if (mintingStatus === "success" && mintedCount < 16) {
      setTimeout(() => {
        setCurrentPieceIndex((prevIndex) => (prevIndex + 1) % chessPieces.length)
        setMintingStatus("idle")
      }, 2000)
    }
  }, [mintingStatus, mintedCount])

  const generateAIChessPieceImage = async (pieceName) => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceName }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate image: ${response.status}`);
      }
      
      // Check if the output exists and is an array
      if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format from image generation API");
      }
      
      // Set the image URL
      setImageURL(data.output[0]);
      return data.output[0];
    } catch (error) {
      console.error("Error generating AI image:", error);
      // Show a placeholder or fallback image
      setImageURL("/placeholder.svg");
      throw error;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateMetadata = async (piece) => {
    const imageHash = await uploadImageToPinata(piece)
    console.log(imageHash)

    const metadata = {
      name: piece.name,
      description: `A unique NFT representing the ${piece.name} chess piece.`,
      image: imageHash,
      attributes: [
        { trait_type: "Tier", value: getTier(piece.name) },
        { trait_type: "Weight", value: getWeight(piece.name).toString() },
      ],
    }

    return await uploadMetadataToPinata(metadata)
  }

  const uploadImageToPinata = async (piece) => {
    try {
      // Step 3: Fetch image and convert to Blob
      const imageResponse = await fetch(imageURL)
      const imageBlob = await imageResponse.blob()
      const file = new File([imageBlob], `${piece.name}.png`, { type: "image/png" })

      // Step 4: Upload to Pinata
      const formData = new FormData()
      formData.append("file", file)
      formData.append("pinataMetadata", JSON.stringify({ name: piece.name }))
      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }))

      const pinataResponse = await fetch(`${NEXT_PUBLIC_PINATA_API_URL}/pinFileToIPFS`, {
        method: "POST",
        headers: { Authorization: `Bearer ${NEXT_PUBLIC_PINATA_JWT}` },
        body: formData,
      })

      const pinataData = await pinataResponse.json()
      return pinataData.IpfsHash // Returns the uploaded image CID
    } catch (error) {
      console.error("Error uploading image to Pinata:", error)
      throw error
    }
  }

  const uploadMetadataToPinata = async (metadata) => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_PINATA_API_URL}/pinJSONToIPFS`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NEXT_PUBLIC_PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: { name: metadata.name },
        }),
      })

      const data = await response.json()
      return data.IpfsHash
    } catch (error) {
      console.error("Error uploading metadata:", error)
      throw error
    }
  }

  const getTier = (pieceName) => {
    switch (pieceName) {
      case "King":
      case "Queen":
        return "Legendary"
      case "Rook":
      case "Bishop":
      case "Knight":
        return "Epic"
      default:
        return "Common"
    }
  }

  const getWeight = (pieceName) => {
    switch (pieceName) {
      case "King":
        return 100
      case "Queen":
        return 90
      case "Rook":
        return 50
      case "Bishop":
      case "Knight":
        return 30
      default:
        return 10
    }
  }

  const mintNFT = async () => {
    setMintingStatus("minting")
    try {
      const piece = chessPieces[currentPieceIndex]
      const metadataHash = await generateMetadata(piece)

      // Connect to the Ethereum network
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = provider.getSigner()

      // Create contract instance
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      // Mint NFT
      const tx = await nftContract.createToken(metadataHash)
      await tx.wait()

      setMintingStatus("success")
      setMintedCount((prevCount) => prevCount + 1)
    } catch (error) {
      console.error("Error minting NFT:", error)
      setMintingStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Mint Your Chess NFTs</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPieceIndex}
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
                    alt={chessPieces[currentPieceIndex].name}
                    layout="fill"
                    objectFit="contain"
                  />
                )
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">{chessPieces[currentPieceIndex].name}</h3>
            <p className="text-sm text-gray-300 mb-4">
              Tier: {getTier(chessPieces[currentPieceIndex].name)} | Weight:{" "}
              {getWeight(chessPieces[currentPieceIndex].name)}
            </p>
            <Button
              onClick={mintNFT}
              disabled={mintingStatus !== "idle" || isGeneratingImage}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-full shadow-lg transition-all duration-300"
            >
              {mintingStatus === "minting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mintingStatus === "success" ? (
                "Minted!"
              ) : (
                "Mint NFT"
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-300">Minted: {mintedCount} / 16 Chess Pieces</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(mintedCount / 16) * 100}%` }}
            ></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

