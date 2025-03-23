import { AptosClient, Types, AptosAccount, HexString, TxnBuilderTypes } from "aptos";

// Initialize Aptos client - use your preferred network
const client = new AptosClient(
  process.env.NEXT_PUBLIC_APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com/v1"
);

// Function to fetch market items from DynamicNFTMarket module
export async function fetchMarketItems(marketAddress: string): Promise<any[]> {
  try {
    // Call the view function fetch_market_items
    const payload: Types.ViewRequest = {
      function: `${marketAddress}::DynamicNFTMarket::fetch_market_items`,
      type_arguments: [],
      arguments: [marketAddress],
    };

    const response = await client.view(payload);
    
    if (!response || !Array.isArray(response[0])) {
      console.error("Unexpected response format:", response);
      return [];
    }

    // Parse the response
    return response[0].map((item: any) => ({
      item_id: parseInt(item.item_id),
      nft_contract: item.nft_contract,
      token_id: parseInt(item.token_id),
      seller: item.seller,
      owner: item.owner,
      price: item.price,
      sold: item.sold,
      name: item.name,
      trait: item.trait,
      weight: parseInt(item.weight),
      image_ipfs_hash: item.image_ipfs_hash
    }));
  } catch (error) {
    console.error("Error fetching market items:", error);
    throw error;
  }
}

// Updated function to fetch my NFTs using the new view function
export async function fetchMyNFTs(accountAddress: string, marketAddress: string): Promise<any[]> {
  try {
    // Use the new view function that takes an address directly
    const payload: Types.ViewRequest = {
      function: `${marketAddress}::DynamicNFTMarket::fetch_nfts_by_owner`,
      type_arguments: [],
      arguments: [accountAddress, marketAddress],
    };

    const response = await client.view(payload);
    
    if (!response || !Array.isArray(response[0])) {
      console.error("Unexpected response format:", response);
      return [];
    }

    // Parse the response
    return response[0].map((item: any) => ({
      item_id: parseInt(item.item_id),
      nft_contract: item.nft_contract,
      token_id: parseInt(item.token_id),
      seller: item.seller,
      owner: item.owner,
      price: item.price,
      sold: item.sold,
      name: item.name,
      trait: item.trait,
      weight: parseInt(item.weight),
      image_ipfs_hash: item.image_ipfs_hash
    }));
  } catch (error) {
    console.error("Error fetching my NFTs:", error);
    throw error;
  }
}

// New function to fetch items created by a seller
export async function fetchItemsCreatedBySeller(sellerAddress: string, marketAddress: string): Promise<any[]> {
  try {
    // Use the new view function
    const payload: Types.ViewRequest = {
      function: `${marketAddress}::DynamicNFTMarket::fetch_items_created_by_seller`,
      type_arguments: [],
      arguments: [sellerAddress, marketAddress],
    };

    const response = await client.view(payload);
    
    if (!response || !Array.isArray(response[0])) {
      console.error("Unexpected response format:", response);
      return [];
    }

    // Parse the response
    return response[0].map((item: any) => ({
      item_id: parseInt(item.item_id),
      nft_contract: item.nft_contract,
      token_id: parseInt(item.token_id),
      seller: item.seller,
      owner: item.owner,
      price: item.price,
      sold: item.sold,
      name: item.name,
      trait: item.trait,
      weight: parseInt(item.weight),
      image_ipfs_hash: item.image_ipfs_hash
    }));
  } catch (error) {
    console.error("Error fetching items created by seller:", error);
    throw error;
  }
}

// Function to create market sale (buy NFT)
export async function createMarketSale(
  marketAddress: string,
  nftContract: string,
  itemId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // This requires the user's account - typically handled through wallet connection
    if (!window.aptos) {
      throw new Error("Aptos wallet not found. Please install the Aptos wallet extension.");
    }

    // Get the listing price from the contract
    const price = await getListingPrice(marketAddress);

    // Create the transaction payload
    const payload = {
      type: "entry_function_payload",
      function: `${marketAddress}::DynamicNFTMarket::create_market_sale`,
      type_arguments: [],
      arguments: [
        marketAddress,
        nftContract,
        itemId.toString()
        // Note: In your Move contract, payment handling might need to be handled differently
      ]
    };

    // Submit the transaction through the user's wallet
    const response = await window.aptos.signAndSubmitTransaction(payload);

    // Wait for transaction confirmation
    await client.waitForTransaction(response.hash);

    return { success: true };
  } catch (error) {
    console.error("Error creating market sale:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Transaction failed" 
    };
  }
}

// Get listing price from contract
async function getListingPrice(marketAddress: string): Promise<string> {
  try {
    const payload: Types.ViewRequest = {
      function: `${marketAddress}::DynamicNFTMarket::get_listing_price`,
      type_arguments: [],
      arguments: [marketAddress],
    };

    const response = await client.view(payload);
    return response[0];
  } catch (error) {
    console.error("Error getting listing price:", error);
    throw error;
  }
}

// Create market item (list NFT for sale)
export async function createMarketItem(
  marketAddress: string,
  nftContract: string,
  tokenId: number,
  price: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.aptos) {
      throw new Error("Aptos wallet not found. Please install the Aptos wallet extension.");
    }

    // Get the listing price from the contract
    const listingPrice = await getListingPrice(marketAddress);

    // Create the transaction payload
    const payload = {
      type: "entry_function_payload",
      function: `${marketAddress}::DynamicNFTMarket::create_market_item`,
      type_arguments: [],
      arguments: [
        marketAddress,
        nftContract,
        tokenId.toString(),
        price
      ]
    };

    // Submit the transaction through the user's wallet
    const response = await window.aptos.signAndSubmitTransaction(payload);

    // Wait for transaction confirmation
    await client.waitForTransaction(response.hash);

    return { success: true };
  } catch (error) {
    console.error("Error creating market item:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Transaction failed" 
    };
  }
}

// Add TypeScript declaration for Aptos wallet integration
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>;
      isConnected: () => Promise<boolean>;
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
      account: () => Promise<{ address: string }>;
    };
  }
}