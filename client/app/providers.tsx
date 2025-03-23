"use client";

import { PropsWithChildren } from "react";
import { 
  AptosWalletAdapterProvider,
} from "@aptos-labs/wallet-adapter-react";

import { useToast } from "@/hooks/use-toast";
import { APTOS_API_KEY, NETWORK } from "@/constants/constants";

export function WalletProvider({ children }: PropsWithChildren) {
  const { toast } = useToast();

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: NETWORK,
        aptosApiKeys: { [NETWORK]: APTOS_API_KEY } 
      }}
      onError={(error) => {
        toast({
          variant: "destructive",
          title: "Wallet Error",
          description: error?.message || "Unknown wallet error",
        });
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}