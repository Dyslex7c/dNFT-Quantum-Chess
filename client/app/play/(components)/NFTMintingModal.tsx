"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { AptosClient, AptosAccount, TxnBuilderTypes, BCS } from "aptos"

interface NFTMintingModalProps {
  onClose: () => void;
}

// Aptos configuration
const NFT_MODULE_ADDRESS = "0x9b29080e47a564c1d256ed74663f2ad4bf4b8e8971cd308004038479399464df"
const NETWORK_NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1"

// Pinata configuration
const NEXT_PUBLIC_PINATA_API_URL = process.env.NEXT_PUBLIC_PINATA_API_URL
const NEXT_PUBLIC_PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY
const NEXT_PUBLIC_PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT

const chessPieces = [
  { name: "Pawn", maxCount: 8, image: "/chess-pieces/pawn.png", trait: "Forward", weight: 10 },
  { name: "Rook", maxCount: 2, image: "/chess-pieces/rook.png", trait: "Castle", weight: 50 },
  { name: "Knight", maxCount: 2, image: "/chess-pieces/knight.png", trait: "Jump", weight: 30 },
  { name: "Bishop", maxCount: 2, image: "/chess-pieces/bishop.png", trait: "Diagonal", weight: 30 },
  { name: "Queen", maxCount: 1, image: "/chess-pieces/queen.png", trait: "Powerful", weight: 90 },
  { name: "King", maxCount: 1, image: "/chess-pieces/king.png", trait: "Royal", weight: 100 },
]

export default function NFTMintingModal({ onClose }: NFTMintingModalProps) {
  const [selectedPieces, setSelectedPieces] = useState(chessPieces.map((piece) => ({ ...piece, count: 0 })))
  const [mintingStatus, setMintingStatus] = useState("idle")
  const [mintedCount, setMintedCount] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>("idle")
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  const generateImage = async (pieceName: string): Promise<string> => {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pieceName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }

      const data = await response.json();
      return `data:image/jpeg;base64,${data.output[0]}`;
    } catch (error) {
      console.error(`Error generating image for ${pieceName}:`, error);
      // Fallback to static image if generation fails
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="blue"/><text x="50%" y="50%" font-size="24" text-anchor="middle" fill="white">${pieceName}</text></svg>`;
    }
  }

  const uploadGeneratedImageToPinata = async (imageUrl: string, pieceName: string) => {
    try {
      const base64Data = imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const file = new File([blob], `${pieceName}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("pinataMetadata", JSON.stringify({ name: pieceName }));
      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const pinataResponse = await fetch(`${NEXT_PUBLIC_PINATA_API_URL}/pinFileToIPFS`, {
        method: "POST",
        headers: { Authorization: `Bearer ${NEXT_PUBLIC_PINATA_JWT}` },
        body: formData,
      });

      const pinataData = await pinataResponse.json();
      return pinataData.IpfsHash;
    } catch (error) {
      console.error("Error uploading generated image to Pinata:", error);
      throw error;
    }
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

  // 1. Add a function to first initialize the contract if needed
  const initializeNFTContract = async () => {
    try {
      // Check if wallet is connected
      if (!window.aptos) {
        throw new Error("Petra wallet not found. Please install the Petra extension.");
      }
      
      await window.aptos.connect();
      const account = await window.aptos.account();
      const client = new AptosClient(NETWORK_NODE_URL);
      
      // Check if the contract is already initialized for this account
      try {
        const resources = await client.getAccountResources(account.address);
        const dynamicNFTType = `${NFT_MODULE_ADDRESS}::DynamicNFT::DynamicNFT`;
        
        // If the resource exists, the contract is already initialized
        const hasResource = resources.some(resource => resource.type === dynamicNFTType);
        if (hasResource) {
          console.log("NFT contract already initialized for this account");
          return true; // Skip initialization, it's already done
        }
      } catch (resourceError) {
        console.warn("Error checking resources:", resourceError);
        // Continue with initialization attempt
      }
      
      // Only attempt to initialize if not already initialized
      const payload = {
        type: "entry_function_payload",
        function: `${NFT_MODULE_ADDRESS}::DynamicNFT::initialize`,
        type_arguments: [],
        arguments: [
          "0x1" // Using a simple valid address for marketplace
        ]
      };
      
      const response = await window.aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);
      console.log("NFT contract initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing NFT contract:", error);
      
      // Check error message for clues
      if (error.message && (
          error.message.includes("already has a resource") ||
          error.message.includes("already published"))) {
        console.log("NFT contract already initialized (from error message)");
        return true;
      }
      throw error;
    }
  };

// 2. Update your mintNFTs function to initialize first
const mintNFTs = async () => {
  setMintingStatus("minting");
  setCurrentStep("generating");
  setErrorMessage(null);
  
  try {
    // Check if Petra wallet is installed
    if (!window.aptos) {
      throw new Error("Petra wallet not found. Please install the Petra extension.");
    }
    
    // Connect to wallet
    await window.aptos.connect();
    const client = new AptosClient(NETWORK_NODE_URL);
    
    // Initialize contract first if needed
    await initializeNFTContract();
    
    // Generate images first
    const newGeneratedImages: { [key: string]: string } = {};
    for (const piece of selectedPieces) {
      if (piece.count > 0) {
        const imageUrl = await generateImage(piece.name);
        newGeneratedImages[piece.name] = imageUrl;
      }
    }
    setGeneratedImages(newGeneratedImages);
    
    // Start minting process
    setCurrentStep("minting");
    
    for (const piece of selectedPieces) {
      for (let i = 0; i < piece.count; i++) {
        // Upload image to IPFS
        const imageIpfsHash = await uploadGeneratedImageToPinata(newGeneratedImages[piece.name], piece.name);
        
        // Create NFT token
        const payload = {
          type: "entry_function_payload",
          function: `${NFT_MODULE_ADDRESS}::DynamicNFT::create_token`,
          type_arguments: [],
          arguments: [
            piece.name,              // name
            piece.trait,             // trait
            piece.weight.toString(), // weight
            imageIpfsHash            // image_ipfs_hash
          ]
        };
        
        // Submit transaction to blockchain
        const response = await window.aptos.signAndSubmitTransaction(payload);
        
        // Log the transaction for debugging
        console.log("Transaction submitted:", response.hash);
        
        // Wait for transaction confirmation
        await client.waitForTransaction(response.hash);
        
        setMintedCount((prevCount) => prevCount + 1);
      }
    }

    setMintingStatus("success");
    setCurrentStep("complete");
  } catch (error: any) {
    console.error("Error minting NFTs:", error);
    
    // Enhanced error handling
    let errorMsg = "An unknown error occurred during minting";
    
    if (error.message) {
      errorMsg = error.message;
    } else if (error.response && error.response.data) {
      errorMsg = JSON.stringify(error.response.data);
    }
    
    setMintingStatus("error");
    setCurrentStep("error");
    setErrorMessage(errorMsg);
  }
};

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-900 to-purple-900 text-white p-4">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold">Mint Your Chess NFTs</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {selectedPieces.map((piece, index) => (
            <motion.div
              key={piece.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex flex-col items-center bg-gray-800 rounded-lg p-3"
            >
              <div className="relative w-16 h-16 mb-1">
                {generatedImages[piece.name] ? (
                  <div className="relative w-full h-full">
                    <img
                      src={generatedImages[piece.name]}
                      alt={piece.name}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <Image
                    src={piece.image || "/placeholder.svg"}
                    alt={piece.name}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                )}
              </div>
              <h3 className="text-base font-semibold mb-1">{piece.name}</h3>
              <p className="text-xs text-blue-300 mb-1">
                {getTier(piece.name)} • Weight: {piece.weight}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleDecrement(index)}
                  disabled={piece.count === 0 || mintingStatus === "minting"}
                  className="px-2 py-1 h-7 bg-red-500 hover:bg-red-600"
                >
                  -
                </Button>
                <span className="text-lg font-bold">{piece.count}</span>
                <Button
                  onClick={() => handleIncrement(index)}
                  disabled={piece.count === piece.maxCount || totalSelectedPieces === 16 || mintingStatus === "minting"}
                  className="px-2 py-1 h-7 bg-green-500 hover:bg-green-600"
                >
                  +
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mb-3">
          <p className="text-base font-semibold">Total Selected: {totalSelectedPieces} / 16</p>
          {currentStep === "generating" && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <p className="text-sm text-blue-300">Generating AI images...</p>
            </div>
          )}
          {currentStep === "minting" && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              <p className="text-sm text-blue-300">
                Minting NFTs... {mintedCount} of {totalSelectedPieces} complete
              </p>
            </div>
          )}
        </div>
        {errorMessage && (
          <p className="text-center text-red-400 text-sm mb-3">{errorMessage}</p>
        )}
        <Button
          onClick={mintNFTs}
          disabled={totalSelectedPieces === 0 || mintingStatus === "minting"}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 h-9 rounded-full shadow-lg transition-all duration-300"
        >
          {mintingStatus === "minting" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {currentStep === "generating" ? "Generating Images..." : "Minting NFTs..."}
            </>
          ) : mintingStatus === "success" ? (
            "Minted Successfully!"
          ) : (
            "Mint NFTs"
          )}
        </Button>
        {mintingStatus === "success" && (
          <p className="text-center text-green-400 mt-2 text-sm">
            Successfully minted {mintedCount} Chess Piece NFTs! View them in your collection.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Add TypeScript declaration for the Petra wallet
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>
      isConnected: () => Promise<boolean>
      account: () => Promise<{ address: string }>
      disconnect: () => Promise<void>
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>
    }
  }
}