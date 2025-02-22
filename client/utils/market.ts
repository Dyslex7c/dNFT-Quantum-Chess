import { ethers } from "ethers";
import abi from "../app/abi/marketabi";

const contractAddress = "0x96DF61c39067B32044e733169250cFdeC0778eC3";
const nftContractAddress = "0x84D8779e6f128879F99Ea26a2829318867c87721";

// Type for window with ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const getContract = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      return new ethers.Contract(contractAddress, abi, signer);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      return null;
    }
  }
  return null;
};

export const fetchMarketItems = async () => {
  try {
    const contract = await getContract();
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const items = await contract.fetchMarketItems();
    return items.map((item: any) => ({
      id: item[0].toNumber(),
      nftContract: item[1],
      tokenId: item[2].toNumber(),
      seller: item[3],
      owner: item[4],
      price: ethers.utils.formatEther(item[5]),
      sold: item[6],
      ipfsHash: item[7],
    }));
  } catch (error) {
    console.error("Error fetching market items:", error);
    throw error;
  }
};

export const createMarketSale = async (itemId: number, price: string) => {
  try {
    const contract = await getContract();
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    // Convert price to Wei
    const priceInWei = ethers.utils.parseEther(price);
    
    // Create the sale
    const transaction = await contract.createMarketSale(
      nftContractAddress,
      itemId,
      {
        value: priceInWei,
        gasLimit: 250000, // Add reasonable gas limit
      }
    );

    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    
    return {
      success: true,
      transaction: receipt
    };
  } catch (error) {
    console.error("Error creating market sale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};