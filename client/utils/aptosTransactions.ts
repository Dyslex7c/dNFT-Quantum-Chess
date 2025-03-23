// utils/aptosTransactions.ts
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Types } from "aptos";
import { getAptosClient } from "@/app/config";

export const useAptosTransactions = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const client = getAptosClient();

  // Example: Stake tokens for a chess game
  const stakeForGame = async (amount: number) => {
    if (!account) return null;
    
    try {
      const payload = {
        function: "0x1::chess_contract::stake_for_game",
        type_arguments: [],
        arguments: [amount.toString()]
      };
      
      const response = await signAndSubmitTransaction(payload);
      return response;
    } catch (error) {
      console.error("Transaction failed", error);
      return null;
    }
  };

  // Example: Claim NFT reward after winning
  const claimNftReward = async (gameId: string) => {
    if (!account) return null;
    
    try {
      const payload = {
        function: "0x1::chess_contract::claim_nft_reward",
        type_arguments: [],
        arguments: [gameId]
      };
      
      const response = await signAndSubmitTransaction(payload);
      return response;
    } catch (error) {
      console.error("Transaction failed", error);
      return null;
    }
  };

  return {
    stakeForGame,
    claimNftReward
  };
};