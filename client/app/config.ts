// config.ts
import { Aptos, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

export const getAptosClient = () => {
  return new Aptos({
    // For mainnet
    network: Network.TESTNET,
    // For testnet 
    // network: Network.TESTNET,
    // For devnet
    // network: Network.DEVNET,
  });
};

export const getNetworkName = () => {
  // Return the network name based on your chosen network
  return NetworkToNetworkName[Network.TESTNET]; // Or TESTNET, DEVNET
};