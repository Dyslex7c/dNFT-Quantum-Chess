import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, CheckCircle2, XCircle } from "lucide-react";
import abi from './platformfeeabi';

const PLATFORM_FEE_CONTRACT = `0x6774e9894067b22Da5EA22d6F5964c08c0680a59`;

interface PlatformFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PlatformFeeModal({ isOpen, onClose, onPaymentSuccess }: PlatformFeeModalProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const { address } = useAccount();

  const { data: hasPaid } = useReadContract({
    address: PLATFORM_FEE_CONTRACT as `0x${string}`,
    abi: abi,
    functionName: 'hasPaidFee',
    args: [address],
  });

  const { data: feeAmount }: { data: bigint | undefined } = useReadContract({
    address: PLATFORM_FEE_CONTRACT as `0x${string}`,
    abi: abi,
    functionName: 'platformFee',
  });

  const { writeContract } = useWriteContract();

  const handlePayment = async () => {
    if (!address || !feeAmount) return;
  
    setIsPaying(true);
    setError("");
  
    try {
      const config = {
        address: PLATFORM_FEE_CONTRACT as `0x${string}`,
        abi: abi,
        functionName: 'payPlatformFee',
        value: feeAmount as bigint,
      };
  
      await writeContract(config);
      setIsPaying(false);
      onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
      setIsPaying(false);
    }
  };

  const displayFeeAmount = feeAmount ? formatEther(feeAmount as bigint) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Platform Fee
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Complete a one-time payment to start minting NFTs on our platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-900/10">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-300">Fee Amount</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                    {displayFeeAmount} POL
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Status</span>
                <div className="flex items-center gap-2">
                  {hasPaid ? (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handlePayment}
            disabled={isPaying || !!hasPaid || !address || !feeAmount}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment
              </>
            ) : hasPaid ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Fee Already Paid
              </>
            ) : !address ? (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            ) : (
              'Pay Platform Fee'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}