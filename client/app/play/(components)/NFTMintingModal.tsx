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

// Restructured chess pieces array to track remaining counts
const chessPieces = [
  { name: "Pawn", initialCount: 8, remaining: 8 },
  { name: "Rook", initialCount: 2, remaining: 2 },
  { name: "Knight", initialCount: 2, remaining: 2 },
  { name: "Bishop", initialCount: 2, remaining: 2 },
  { name: "Queen", initialCount: 1, remaining: 1 },
  { name: "King", initialCount: 1, remaining: 1 },
]

export default function NFTMintingModal() {
  const [isOpen, setIsOpen] = useState(true)
  const [imageURL, setImageURL] = useState("")
  const [currentPiece, setCurrentPiece] = useState(chessPieces[0])
  const [mintingStatus, setMintingStatus] = useState("idle")
  const [mintedCount, setMintedCount] = useState(0)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [remainingPieces, setRemainingPieces] = useState([...chessPieces])

  useEffect(() => {
    generateAIChessPieceImage(currentPiece.name)
  }, [currentPiece])

  const selectNextPiece = () => {
    const updatedPieces = remainingPieces.map(piece => ({
      ...piece,
      remaining: piece.name === currentPiece.name ? piece.remaining - 1 : piece.remaining
    }))

    // Filter out pieces with no remaining counts
    const availablePieces = updatedPieces.filter(piece => piece.remaining > 0)
    setRemainingPieces(availablePieces)

    if (availablePieces.length > 0) {
      // Select the next piece that has remaining counts
      setCurrentPiece(availablePieces[0])
    }
  }

  useEffect(() => {
    if (mintingStatus === "success" && mintedCount < 16) {
      setTimeout(() => {
        selectNextPiece()
        setMintingStatus("idle")
      }, 2000)
    }
  }, [mintingStatus, mintedCount])

  interface GenerateImageResponse {
    output: string[];
    error?: string;
  }

  const generateAIChessPieceImage = async (pieceName: string): Promise<string> => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieceName }),
      });

      const data: GenerateImageResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate image: ${response.status}`);
      }
      
      if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
        throw new Error("Invalid response format from image generation API");
      }
      
      const base64Image = `data:image/jpeg;base64,${data.output[0]}`;
      setImageURL(base64Image);
      return base64Image;
    } catch (error) {
      console.error("Error generating AI image:", error);
      setImageURL("/placeholder.svg");
      throw error;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  interface Piece {
    name: string;
    initialCount: number;
    remaining: number;
  }

  interface Metadata {
    name: string;
    description: string;
    image: string;
    attributes: { trait_type: string; value: string }[];
  }

  const generateMetadata = async (piece: Piece): Promise<string> => {
    const imageHash = await uploadImageToPinata(piece)
    console.log(imageHash)

    const metadata: Metadata = {
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

  const uploadImageToPinata = async (piece: Piece) => {
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

  const uploadMetadataToPinata = async (metadata: Metadata) => {
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

  interface TierMapping {
    [key: string]: string;
  }

  const getTier = (pieceName: string): string => {
    const tierMapping: TierMapping = {
      King: "Legendary",
      Queen: "Legendary",
      Rook: "Epic",
      Bishop: "Epic",
      Knight: "Epic",
      Pawn: "Common",
    };

    return tierMapping[pieceName] || "Common";
  }

  interface WeightMapping {
    [key: string]: number;
  }

  const getWeight = (pieceName: string): number => {
    const weightMapping: WeightMapping = {
      King: 100,
      Queen: 90,
      Rook: 50,
      Bishop: 30,
      Knight: 30,
      Pawn: 10,
    };

    return weightMapping[pieceName] || 10;
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
            <p className="text-sm text-gray-300 mb-2">
              Remaining: {currentPiece.remaining} / {currentPiece.initialCount}
            </p>
            <p className="text-sm text-gray-300 mb-4">
              Tier: {getTier(currentPiece.name)} | Weight: {getWeight(currentPiece.name)}
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

