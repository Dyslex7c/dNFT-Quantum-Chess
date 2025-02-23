"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, PackageOpen, Swords, Scale } from 'lucide-react'
import { NFTCard } from "./nft-card"
import { NFTModal } from "./nft-modal"
import { useSocketContext } from "@/context/SocketContext"
import { useRouter, useParams } from "next/navigation"
import { useAccount } from "wagmi"
import abi from "@/app/collections/abi"

const CONTRACT_ADDRESS = "0x84D8779e6f128879F99Ea26a2829318867c87721"
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY

interface NFT {
	name: string
	description: string
	image: string
	attributes: { trait_type: string; value: string }[]
	tokenId: string
	price: number
	timeLeft: string
	likes: number
	views: number
	tier: "legendary" | "epic" | "rare" | "common"
	ipfsHash: string
	nftContract: string
}

interface SelectedNFT {
	ipfsHash: string;
	weight: number;
	name: string;
}

export default function InventoryPage() {
	const [selectedNFTs, setSelectedNFTs] = useState<SelectedNFT[]>([])
	const [viewingNFT, setViewingNFT] = useState<NFT | null>(null)
	const [nfts, setNfts] = useState<NFT[]>([])
	const [isLoading, setIsLoading] = useState(true)

	const { socket } = useSocketContext()
	const { address } = useAccount()
	const router = useRouter()
	const params = useParams()
	const roomId = params?.roomId as string

	const getTotalWeight = () => {
		return selectedNFTs.reduce((total, nft) => total + nft.weight, 0)
	}

	const handleNFTSelect = (nft: NFT) => {
		const weight = parseInt(nft.attributes.find(attr => attr.trait_type === "Weight")?.value || "0");

		setSelectedNFTs(prev => {
			const isSelected = prev.some(selected => selected.ipfsHash === nft.ipfsHash);

			if (isSelected) {
				return prev.filter(selected => selected.ipfsHash !== nft.ipfsHash);
			} else if (prev.length < 16) {
				return [...prev, { ipfsHash: nft.ipfsHash, weight, name: nft.name }];
			}
			return prev;
		});
	};

	const handleNFTView = (nft: NFT) => {
		setViewingNFT(nft)
	}

	useEffect(() => {
		async function fetchNFTs() {
			setIsLoading(true)
			if (!window.ethereum || !address) {
				console.error("MetaMask is not installed or no address found.")
				return
			}

			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider)

			try {
				const [tokenIds, tokenURIs] = await contract.getUserTokens(address)

				const fetchedNFTs: NFT[] = (
					await Promise.all(
						tokenURIs.map(async (uri: string, index: number) => {
							const url = `${PINATA_GATEWAY}${uri}`
							const tokenId = tokenIds[index]
							try {
								const response = await fetch(url)
								if (!response.ok) throw new Error(`Failed to fetch metadata for URI: ${uri}`)
								const metadata = await response.json()
								return {
									...metadata,
									tokenId: tokenId.toString(),
									ipfsHash: uri,
									nftContract: CONTRACT_ADDRESS,
								}
							} catch (error) {
								console.error("Error fetching metadata:", error)
								return null
							}
						}),
					)
				).filter((nft): nft is NFT => nft !== null)

				setNfts(fetchedNFTs)
			} catch (error) {
				console.error("Error fetching NFTs:", error)
			}
			setIsLoading(false)
		}

		fetchNFTs()
	}, [address])
	console.log(selectedNFTs)

	const handleGameAction = () => {
		if (!address || selectedNFTs.length === 0) return;

		localStorage.setItem("selectedNFTs", JSON.stringify(selectedNFTs));

		if (roomId) {
			socket?.emit("joinRoom", {
				p2Id: address,
				R2: 700,
				roomId,
				selectedNFTs,
				totalWeight: getTotalWeight()
			})
		} else {
			socket?.emit("createRoom", {
				p1Id: address,
				R1: 700,
				selectedNFTs,
				totalWeight: getTotalWeight()
			})
		}
	}

	useEffect(() => {
		if (!socket) return

		socket.on("roomCreated", (data) => {
			console.log("Room created:", data)
		})

		socket.on("gameInitialized", (data) => {
			console.log("Game started:", data)
			router.push(`/play/game?id=${data.roomId}`)
		})

		socket.on("error", (error) => {
			console.log("Error:", error)
		})

		return () => {
			socket.off("roomCreated")
			socket.off("gameInitialized")
			socket.off("error")
		}
	}, [socket, router])

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
					<p className="text-blue-200 text-lg">Loading your NFT collection...</p>
				</div>
			</div>
		)
	}

	if (!nfts.length) {
		return (
			<div className="text-center py-20 px-4">
				<PackageOpen className="w-16 h-16 mx-auto text-blue-400 mb-4" />
				<h3 className="text-2xl font-semibold text-white mb-2">No NFTs Found</h3>
				<p className="text-blue-200 mb-6 max-w-md mx-auto">
					Your collection is empty. Start your journey by acquiring unique chess pieces from our marketplace.
				</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white p-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
					<div>
						<h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
							Select Your Chess Pieces
						</h1>
						<div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-blue-200">
							<p>Pieces: {selectedNFTs.length}/16 selected</p>
							<div className="flex items-center gap-2">
								<Scale className="w-4 h-4" />
								<p>Total Weight: {getTotalWeight()}</p>
							</div>
						</div>
					</div>
					<Button
						size="lg"
						onClick={handleGameAction}
						disabled={selectedNFTs.length === 0}
						className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed"
					>
						<Swords className="w-5 h-5 mr-2" />
						{roomId ? "Join Game" : "Start Game"}
					</Button>
				</div>

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.8 }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
				>
					<AnimatePresence mode="popLayout">
						{nfts.reverse().map((nft) => (
							<NFTCard
								key={nft.tokenId}
								nft={nft}
								isSelected={selectedNFTs.some(selected => selected.ipfsHash === nft.ipfsHash)}
								onSelect={() => handleNFTSelect(nft)}
								onView={() => handleNFTView(nft)}
							/>
						))}
					</AnimatePresence>
				</motion.div>
			</div>

			<AnimatePresence>
				{viewingNFT && (
					<NFTModal
						nft={viewingNFT}
						onClose={() => setViewingNFT(null)}
						isSelected={selectedNFTs.some(selected => selected.ipfsHash === viewingNFT.ipfsHash)}
						onSelect={() => handleNFTSelect(viewingNFT)}
					/>
				)}
			</AnimatePresence>
		</div>
	)
}
