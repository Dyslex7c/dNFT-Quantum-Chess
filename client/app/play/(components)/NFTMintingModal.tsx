"use client"

import { useState } from "react"
import { motion } from "framer-motion"
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
  { name: "Pawn", maxCount: 8, image: "/chess-pieces/pawn.png" },
  { name: "Rook", maxCount: 2, image: "/chess-pieces/rook.png" },
  { name: "Knight", maxCount: 2, image: "/chess-pieces/knight.png" },
  { name: "Bishop", maxCount: 2, image: "/chess-pieces/bishop.png" },
  { name: "Queen", maxCount: 1, image: "/chess-pieces/queen.png" },
  { name: "King", maxCount: 1, image: "/chess-pieces/king.png" },
]

export default function NFTMintingModal() {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedPieces, setSelectedPieces] = useState(chessPieces.map((piece) => ({ ...piece, count: 0 })))
  const [mintingStatus, setMintingStatus] = useState("idle")
  const [mintedCount, setMintedCount] = useState(0)

  const getTier = (pieceName: string): string => {
    const tierMapping: { [key: string]: string } = {
      King: "Legendary",
      Queen: "Legendary",
      Rook: "Epic",
      Bishop: "Epic",
      Knight: "Epic",
      Pawn: "Common",
    }
    return tierMapping[pieceName] || "Common"
  }

  const getWeight = (pieceName: string): number => {
    const weightMapping: { [key: string]: number } = {
      King: 100,
      Queen: 90,
      Rook: 50,
      Bishop: 30,
      Knight: 30,
      Pawn: 10,
    }
    return weightMapping[pieceName] || 10
  }

  const uploadImageToPinata = async (piece: any) => {
    try {
      const response = await fetch(piece.image)
      const blob = await response.blob()
      const file = new File([blob], `${piece.name}.png`, { type: "image/png" })

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
      return pinataData.IpfsHash
    } catch (error) {
      console.error("Error uploading image to Pinata:", error)
      throw error
    }
  }

  const uploadMetadataToPinata = async (metadata: any) => {
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

  const generateMetadata = async (piece: any): Promise<string> => {
    const imageHash = await uploadImageToPinata(piece)
    console.log(imageHash)

    const metadata = {
      name: piece.name,
      description: `A unique NFT representing the ${piece.name} chess piece.`,
      image: `${imageHash}`,
      attributes: [
        { trait_type: "Tier", value: getTier(piece.name) },
        { trait_type: "Weight", value: getWeight(piece.name).toString() },
      ],
    }

    return await uploadMetadataToPinata(metadata)
  }

  const totalSelectedPieces = selectedPieces.reduce((sum, piece) => sum + piece.count, 0)

  const handleIncrement = (index: number) => {
    if (totalSelectedPieces < 16) {
      const updatedPieces = [...selectedPieces]
      if (updatedPieces[index].count < updatedPieces[index].maxCount) {
        updatedPieces[index].count++
        setSelectedPieces(updatedPieces)
      }
    }
  }

  const handleDecrement = (index: number) => {
    const updatedPieces = [...selectedPieces]
    if (updatedPieces[index].count > 0) {
      updatedPieces[index].count--
      setSelectedPieces(updatedPieces)
    }
  }

  const mintNFTs = async () => {
    setMintingStatus("minting")
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = provider.getSigner()
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, abi, signer)

      for (const piece of selectedPieces) {
        for (let i = 0; i < piece.count; i++) {
          const metadataHash = await generateMetadata(piece)
          const tx = await nftContract.createToken(metadataHash)
          await tx.wait()
          setMintedCount((prevCount) => prevCount + 1)
        }
      }

      setMintingStatus("success")
    } catch (error) {
      console.error("Error minting NFTs:", error)
      setMintingStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Mint Your Chess NFTs</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {selectedPieces.map((piece, index) => (
            <motion.div
              key={piece.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex flex-col items-center bg-gray-800 rounded-lg p-4"
            >
              <div className="relative w-24 h-24 mb-2">
                <Image src={piece.image || "/placeholder.svg"} alt={piece.name} layout="fill" objectFit="contain" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{piece.name}</h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleDecrement(index)}
                  disabled={piece.count === 0}
                  className="px-2 py-1 bg-red-500 hover:bg-red-600"
                >
                  -
                </Button>
                <span className="text-xl font-bold">{piece.count}</span>
                <Button
                  onClick={() => handleIncrement(index)}
                  disabled={piece.count === piece.maxCount || totalSelectedPieces === 16}
                  className="px-2 py-1 bg-green-500 hover:bg-green-600"
                >
                  +
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mb-4">
          <p className="text-lg font-semibold">Total Selected: {totalSelectedPieces} / 16</p>
        </div>
        <Button
          onClick={mintNFTs}
          disabled={totalSelectedPieces === 0 || mintingStatus === "minting"}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-full shadow-lg transition-all duration-300"
        >
          {mintingStatus === "minting" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : mintingStatus === "success" ? (
            "Minted!"
          ) : (
            "Mint NFTs"
          )}
        </Button>
        {mintingStatus === "success" && (
          <p className="text-center text-green-400 mt-2">Successfully minted {mintedCount} NFTs!</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

