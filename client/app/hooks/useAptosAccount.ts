// hooks/useAptosAccount.ts
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { getAptosClient } from "@/app/config";

export const useAptosAccount = () => {
  const { account, connected } = useWallet();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account || !connected) {
        setBalance("0");
        return;
      }

      setIsLoading(true);
      try {
        const client = getAptosClient();
        
        const resources = await client.getAccountResources({
          accountAddress: account.address,
        });

        const aptosCoinResource = resources.find(
          (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
        );

        if (aptosCoinResource) {
          // @ts-ignore - parsing the data
          const coinValue = aptosCoinResource.data.coin.value;
          // Convert from octas (10^-8) to APT
          setBalance((parseInt(coinValue) / 100000000).toString());
        } else {
          setBalance("0");
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance("0");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 15 seconds
    const intervalId = setInterval(fetchBalance, 15000);
    
    return () => clearInterval(intervalId);
  }, [account, connected]);

  return {
    account,
    connected,
    balance,
    isLoading
  };
};