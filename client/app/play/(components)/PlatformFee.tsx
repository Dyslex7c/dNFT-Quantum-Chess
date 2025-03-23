// Updated PlatformFeeModal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Loader2 } from "lucide-react";

interface PlatformFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  payPlatformFee: () => Promise<boolean>;
}

export default function PlatformFeeModal({ 
  isOpen, 
  onClose, 
  onPaymentSuccess,
  payPlatformFee 
}: PlatformFeeModalProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connected } = useWallet();

  const handlePayFee = async () => {
    if (!connected) {
      setError("Please connect your wallet first");
      return;
    }

    setError(null);
    setIsPaying(true);
    
    try {
      console.log("Attempting to pay platform fee...");
      const success = await payPlatformFee();
      
      if (success) {
        console.log("Platform fee payment successful!");
        onPaymentSuccess();
      } else {
        console.log("Platform fee payment failed.");
        setError("Transaction failed. Please try again.");
      }
    } catch (error) {
      console.error("Error in platform fee payment:", error);
      setError("An error occurred. Please check your wallet and try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Platform Fee Required</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>
            To use the NFT minting feature, a one-time platform fee of <span className="text-purple-400 font-bold">10 APT</span> is required.
          </p>
          <div className="rounded-lg bg-purple-900/20 p-4 border border-purple-500/20">
            <h3 className="font-semibold mb-2">Benefits include:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access to exclusive NFT collections</li>
              <li>Reduced transaction fees for NFT minting</li>
              <li>Early access to new chess piece designs</li>
              <li>Participation in governance decisions</li>
            </ul>
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-center pt-2">
            <Button
              onClick={handlePayFee}
              disabled={isPaying || !connected}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-2 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)] transition-all duration-300"
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Platform Fee"
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-400 pt-2">
            This is a one-time fee that grants lifetime access to the platform.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}