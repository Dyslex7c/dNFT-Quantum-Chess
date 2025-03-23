"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronRight, Origami, ShoppingBag, Sparkles, Plus, Shield } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import NFTMintingModal from "./(components)/NFTMintingModal"
import ProofVerificationModal from './(components)/ProofVerificationModal';
import PlatformFeeModal from "./(components)/PlatformFee"
import { useSocketContext } from "@/context/SocketContext"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { AptosClient, Types } from "aptos"

export default function Dashboard() {
  const [showMintingModal, setShowMintingModal] = useState(false);
  const [showPlatformFeeModal, setShowPlatformFeeModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [hasPaidPlatformFee, setHasPaidPlatformFee] = useState(false);
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "GrandMaster1", elo: 2800, tier: "Grandmaster" },
    { rank: 2, name: "QueenSlayer", elo: 2750, tier: "Master" },
    { rank: 3, name: "KnightRider", elo: 2700, tier: "Master" },
    { rank: 4, name: "BishopBoss", elo: 2650, tier: "Diamond" },
    { rank: 5, name: "RookieNo1", elo: 2600, tier: "Diamond" },
  ]);

  const { account, connected, signAndSubmitTransaction } = useWallet();
  const { socket } = useSocketContext();
  const [user, setUser] = useState({
    address: account?.address,
    rank: 700
  });

  const navigation = useRouter();

  const userTier = "Gold"
  const userRank = 42

  // Platform fee contract configuration
  const moduleAddress = "0x6774e9894067b22Da5EA22d6F5964c08c0680a59";
  const moduleName = "platform_fee";
  const functionName = "has_paid_fee";

  // Check if user has paid platform fee
  useEffect(() => {
    // Assuming you have imported and set up the wallet adapter properly
// This assumes the latest version of the Aptos wallet adapter

const checkPlatformFee = async () => {
  if (!connected || !account?.address) return;
  
  try {
    // Convert address to proper format if needed
    const addressStr = typeof account.address === 'string' 
      ? account.address 
      : account.address.toString();
    
    // Create a client instance
    const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1"); // Use your network URL
    
    // Using the generic view function with proper payload structure
    const payload = {
      function: `${moduleAddress}::${moduleName}::${functionName}`,
      type_arguments: [],
      arguments: [addressStr]
    };
    
    // Try the method that should be available in recent versions
    const response = await client.view(payload);
    
    setHasPaidPlatformFee(response[0]);
  } catch (error) {
    console.error("Error checking platform fee:", error);
    setHasPaidPlatformFee(false);
  }
};

    if (connected) {
      checkPlatformFee();
    }
  }, [connected, account?.address]);

  // Update user state when wallet connection changes
  useEffect(() => {
    if (connected && account) {
      setUser({
        address: account.address,
        rank: 700
      });
    }
  }, [connected, account]);

  // Leaderboard animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard((prevLeaderboard) => {
        const newLeaderboard = [...prevLeaderboard]
        for (let i = 0; i < newLeaderboard.length; i++) {
          if (Math.random() > 0.7) {
            newLeaderboard[i].elo += Math.floor(Math.random() * 10)
          }
        }
        return newLeaderboard.sort((a, b) => b.elo - a.elo)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, []);

  // Pay platform fee function
  // Modify the payPlatformFee function in your Dashboard.js
// More robust implementation with error checking
// Updated payPlatformFee function without window.aptos dependency
// Fixed payPlatformFee function
const payPlatformFee = async () => {
  if (!connected || !account) {
    console.log("Wallet not connected");
    return false;
  }
  
  try {
    console.log("Creating transaction payload...");
    
    // Platform fee amount and address
    const platformFeeAmount = "10000000"; // 10 APT in octas
    const platformAddress = "0x9b29080e47a564c1d256ed74663f2ad4bf4b8e8971cd308004038479399464df";
    
    // Create transaction payload
    const payload = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [
        platformAddress,
        platformFeeAmount
      ]
    };
    
    console.log("Transaction payload:", payload);
    
    // Use signAndSubmitTransaction from wallet adapter
    const pendingTransaction = await signAndSubmitTransaction(payload);
    console.log("Transaction submitted successfully:", pendingTransaction);
    
    // Wait for transaction confirmation
    // You may want to add proper transaction confirmation logic here
    
    // Store payment status
    localStorage.setItem(`platformFeePaid_${account.address}`, "true");
    setHasPaidPlatformFee(true);
    
    return true;
  } catch (error) {
    console.error("Error paying platform fee:", error);
    return false;
  }
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0a0f18] to-black text-white overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Welcome To Chess Forge
          </h1>
          <Button
            onClick={() => {
              if (!connected) {
                alert("Please connect your wallet first");
                return;
              }
                setShowMintingModal(true);
              
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)] transition-all duration-300"
          >
            <Plus className="mr-2 h-5 w-5" />
            Mint NFTs
          </Button>
          <Button
            onClick={() => {
              if (!connected) {
                alert("Please connect your wallet first");
                return;
              }
              setShowProofModal(true);
            }}
            className="mr-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transition-all duration-300"
          >
            <Shield className="mr-2 h-5 w-5" />
            Verify Proof
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-1 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
            <div className="flex items-center justify-between mb-4">
              <span>Connected:</span>
              <span className={`font-bold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                {connected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span>Current Tier:</span>
              <span className="text-yellow-400 font-bold">{userTier}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span>Global Rank:</span>
              <span className="text-blue-400 font-bold">#{userRank}</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full"
                style={{ width: "70%" }}
              ></div>
            </div>
            <p className="text-sm text-blue-300">230 XP to next tier</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <h2 className="text-xl font-semibold mb-4">Quick Match</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-8 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transition-all duration-300"
                onClick={() => navigation.push("/play/join")}
              >
                Play Ranked
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)] transition-all duration-300"
                onClick={() => navigation.push("/play/inventory")}
              >
                Create Custom Game
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="col-span-1 bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/20 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            <h2 className="text-xl font-semibold mb-4">NFT Marketplace</h2>
            <p className="text-sm text-purple-300 mb-4">Buy, sell, and use unique chess pieces in your games!</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigation.push("/marketplace")}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-4 text-lg rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)] transition-all duration-300"
              >
                Visit Marketplace
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => navigation.push("/collections")}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-8 py-4 text-lg rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transition-all duration-300"
              >
                Visit Collection
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <h2 className="text-xl font-semibold mb-4">Global Leaderboard</h2>
            <div className="overflow-hidden">
              {leaderboard.map((player, index) => (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 border-b border-blue-500/20 last:border-b-0"
                >
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-4 w-8">{player.rank}</span>
                    <span className="text-lg">{player.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-400 font-bold mr-4">{player.elo}</span>
                    <span className="text-sm text-gray-400">{player.tier}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 col-span-1 md:col-span-2 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Origami className="w-5 h-5 text-purple-500" />
              Featured NFT
              <span className="text-sm text-gray-400 ml-2">Limited time offer!</span>
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Legendary Knight</h3>
              <p className="text-gray-400 mb-4">Be the King of Crypto and Conquer the Chain!</p>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-mono">Price: 1170 APT</span>
                <Button onClick={() => navigation.push("/marketplace")} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  View in Marketplace
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="fixed -bottom-20 -left-20 opacity-10 pointer-events-none">
          <Image src="/knight.png" alt="Chess Knight" width={300} height={300} />
        </div>
        <div className="fixed -top-20 -right-20 opacity-10 pointer-events-none">
          <Image src="/rook.png" alt="Chess Queen" width={300} height={300} />
        </div>
      </div>
      {showMintingModal && <NFTMintingModal onClose={() => setShowMintingModal(false)} />}
      {showProofModal && <ProofVerificationModal onClose={() => setShowProofModal(false)} />}
      {/* {showPlatformFeeModal && (
        <PlatformFeeModal
          isOpen={showPlatformFeeModal}
          onClose={() => setShowPlatformFeeModal(false)}
          onPaymentSuccess={() => {
            setShowPlatformFeeModal(false);
            setShowMintingModal(true);
          }}
          payPlatformFee={payPlatformFee}
        />
      )} */}
    </main>
  )
}