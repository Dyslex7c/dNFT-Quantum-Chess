import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import abi from './platformfeeabi';

const PLATFORM_FEE_CONTRACT = "0x6774e9894067b22Da5EA22d6F5964c08c0680a59";

export default function PlatformFeeModal({ isOpen, onClose, onPaymentSuccess }) {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const { address } = useAccount();

  // Check if user has already paid fee
  const { data: hasPaid } = useReadContract({
    address: PLATFORM_FEE_CONTRACT,
    abi: abi,
    functionName: 'hasPaidFee',
    args: [address],
    watch: true,
  });

  // Get platform fee amount
  const { data: feeAmount } = useReadContract({
    address: PLATFORM_FEE_CONTRACT,
    abi: abi,
    functionName: 'platformFee',
  });

  // Execute the write contract
  const { writeContract, isError } = useWriteContract();

  const handlePayment = async () => {
    if (!address || !feeAmount) return;

    setIsPaying(true);
    setError("");

    try {
      const config = {
        address: PLATFORM_FEE_CONTRACT,
        abi: abi,
        functionName: 'payPlatformFee',
        value: feeAmount,
      };

      await writeContract(config);
      
      // Wait for transaction confirmation
      setIsPaying(false);
      onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Transaction failed. Please try again.");
      setIsPaying(false);
    }
  };

  const displayFeeAmount = feeAmount ? formatEther(feeAmount) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border-blue-500/20">
        <DialogHeader>
          <DialogTitle>Platform Fee Payment</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6">
            <p className="text-lg mb-2">
              To start minting NFTs, a one-time platform fee is required.
            </p>
            <p className="text-sm text-gray-400">
              Fee Amount: {displayFeeAmount} POL
            </p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isPaying || hasPaid || !address || !feeAmount}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : hasPaid ? (
              "Fee Already Paid"
            ) : !address ? (
              "Connect Wallet"
            ) : (
              "Pay Platform Fee"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
