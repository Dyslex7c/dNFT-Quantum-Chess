module market_addr::DynamicNFTMarket {
    use std::vector;
    use std::string::String;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::signer;
    // Note: The 'coin' import is marked as unused in the warnings
    // Uncomment if you plan to use it
    // use aptos_framework::coin;
    use nft_addr::DynamicNFT;
    
    struct NFTMarket has key {
        item_ids: u64,
        items_sold: u64,
        owner: address,
        listing_price: u64,
        id_to_market_item: vector<MarketItem>
    }

    struct MarketItem has store, drop, copy {
        item_id: u64,
        nft_contract: address,
        token_id: u64,
        seller: address,
        owner: address,
        price: u64,
        sold: bool,
        name: String,
        trait: String,
        weight: u64,
        image_ipfs_hash: String
    }

    struct MarketItemCreatedEvent has drop, store {
        item_id: u64,
        nft_contract: address,
        token_id: u64,
        seller: address,
        owner: address,
        price: u64,
        sold: bool,
        name: String,
        trait: String,
        weight: u64,
        image_ipfs_hash: String
    }

    // Events
    struct EventStore has key {
        market_item_created_events: EventHandle<MarketItemCreatedEvent>
    }
    
    // Reentrancy guard replacement
    struct Guard has key {
        locked: bool
    }

    public entry fun initialize(account: &signer) {
        let sender = address_of(account);
        
        let market = NFTMarket {
            item_ids: 0,
            items_sold: 0,
            owner: sender,
            listing_price: 1000000000000000, // 0.001 ether equivalent in Move
            id_to_market_item: vector::empty<MarketItem>()
        };

        let event_store = EventStore {
            market_item_created_events: account::new_event_handle<MarketItemCreatedEvent>(account)
        };
        
        let guard = Guard {
            locked: false
        };

        move_to(account, market);
        move_to(account, event_store);
        move_to(account, guard);
    }
    
    // Simple implementation of reentrancy prevention
    public fun acquire(account: &signer) acquires Guard {
        let sender = address_of(account);
        let guard = borrow_global_mut<Guard>(sender);
        assert!(!guard.locked, 201); // Already locked
        guard.locked = true;
    }
    
    public fun release(account: &signer) acquires Guard {
        let sender = address_of(account);
        let guard = borrow_global_mut<Guard>(sender);
        guard.locked = false;
    }

    public fun get_listing_price(market_address: address): u64 acquires NFTMarket {
        let market = borrow_global<NFTMarket>(market_address);
        market.listing_price
    }

    public entry fun create_market_item(
        account: &signer,
        market_address: address,
        nft_contract: address,
        token_id: u64,
        price: u64
    ) acquires NFTMarket, EventStore, Guard {
        let sender = address_of(account);
        
        acquire(account);
        
        let market = borrow_global_mut<NFTMarket>(market_address);
        assert!(price > 0, 101); // Price must be at least 1 wei
        
        // Get metadata directly from NFT
        let metadata = DynamicNFT::token_metadata(nft_contract, token_id);
        
        // Use accessor functions instead of direct field access
        let name = DynamicNFT::get_metadata_name(&metadata);
        let trait = DynamicNFT::get_metadata_trait(&metadata);
        let weight = DynamicNFT::get_metadata_weight(&metadata);
        let image_ipfs_hash = DynamicNFT::get_metadata_image_ipfs_hash(&metadata);
        
        market.item_ids = market.item_ids + 1;
        let item_id = market.item_ids;
        
        let market_item = MarketItem {
            item_id: item_id,
            nft_contract: nft_contract,
            token_id: token_id,
            seller: sender,
            owner: @0x0, // Address 0 equivalent
            price: price,
            sold: false,
            name: name,
            trait: trait,
            weight: weight,
            image_ipfs_hash: image_ipfs_hash
        };
        
        vector::push_back(&mut market.id_to_market_item, market_item);
        
        // Transfer NFT from sender to market
        DynamicNFT::transfer_token(sender, market_address, token_id);
        
        // Emit event
        let event_store = borrow_global_mut<EventStore>(market_address);
        event::emit_event(
            &mut event_store.market_item_created_events,
            MarketItemCreatedEvent {
                item_id: item_id,
                nft_contract: nft_contract,
                token_id: token_id,
                seller: sender,
                owner: @0x0,
                price: price,
                sold: false,
                name: name,
                trait: trait,
                weight: weight,
                image_ipfs_hash: image_ipfs_hash
            }
        );
        
        release(account);
    }

    public entry fun create_market_sale(
        account: &signer,
        market_address: address,
        nft_contract: address,
        item_id: u64
        // Payment handling would need to be added
    ) acquires NFTMarket, Guard {
        let sender = address_of(account);
        
        acquire(account);
        
        let market = borrow_global_mut<NFTMarket>(market_address);
        
        // Find the market item
        let item_index = 0;
        let found = false;
        while (item_index < vector::length(&market.id_to_market_item)) {
            let item = vector::borrow(&market.id_to_market_item, item_index);
            if (item.item_id == item_id) {
                found = true;
                break;
            };
            item_index = item_index + 1;
        };
        
        assert!(found, 102); // Item not found
        
        let item = vector::borrow_mut(&mut market.id_to_market_item, item_index);
        let token_id = item.token_id;
        
        // Verify payment would be handled by Aptos-specific coin functions
        
        // Transfer NFT from contract to buyer
        DynamicNFT::transfer_token(market_address, sender, token_id);
        
        // Update market item
        item.owner = sender;
        item.sold = true;
        market.items_sold = market.items_sold + 1;
        
        // Transfer payment to seller would require Aptos-specific coin functions
        
        release(account);
    }

    #[view]
    public fun fetch_market_items(market_address: address): vector<MarketItem> acquires NFTMarket {
        let market = borrow_global<NFTMarket>(market_address);
        let items = vector::empty<MarketItem>();
        
        let i = 0;
        let len = vector::length(&market.id_to_market_item);
        
        while (i < len) {
            let item = vector::borrow(&market.id_to_market_item, i);
            if (item.owner == @0x0) {
                vector::push_back(&mut items, *item);
            };
            i = i + 1;
        };
        
        items
    }

    #[view]
    public fun fetch_nfts_by_owner(owner_address: address, market_address: address): vector<MarketItem> acquires NFTMarket {
    let market = borrow_global<NFTMarket>(market_address);
    let items = vector::empty<MarketItem>();
    
    let i = 0;
    let len = vector::length(&market.id_to_market_item);
    
    while (i < len) {
        let item = vector::borrow(&market.id_to_market_item, i);
        if (item.owner == owner_address) {
            vector::push_back(&mut items, *item);
        };
        i = i + 1;
    };
    
    items
}

    public fun fetch_my_nfts(account: &signer, market_address: address): vector<MarketItem> acquires NFTMarket {
    let sender = address_of(account);
    let market = borrow_global<NFTMarket>(market_address);
    let items = vector::empty<MarketItem>();
    
    let i = 0;
    let len = vector::length(&market.id_to_market_item);
    
    while (i < len) {
        let item = vector::borrow(&market.id_to_market_item, i);
        if (item.owner == sender) {
            vector::push_back(&mut items, *item);
        };
        i = i + 1;
    };
    
    items
}

    public fun fetch_items_created(account: &signer, market_address: address): vector<MarketItem> acquires NFTMarket {
        let sender = address_of(account);
        let market = borrow_global<NFTMarket>(market_address);
        let items = vector::empty<MarketItem>();
        
        let i = 0;
        let len = vector::length(&market.id_to_market_item);
        
        while (i < len) {
            let item = vector::borrow(&market.id_to_market_item, i);
            if (item.seller == sender) {
                vector::push_back(&mut items, *item);
            };
            i = i + 1;
        };
        
        items
    }

    #[view]
public fun fetch_items_created_by_seller(seller_address: address, market_address: address): vector<MarketItem> acquires NFTMarket {
    let market = borrow_global<NFTMarket>(market_address);
    let items = vector::empty<MarketItem>();
    
    let i = 0;
    let len = vector::length(&market.id_to_market_item);
    
    while (i < len) {
        let item = vector::borrow(&market.id_to_market_item, i);
        if (item.seller == seller_address) {
            vector::push_back(&mut items, *item);
        };
        i = i + 1;
    };
    
    items
}

    // Helper function to get signer address
    fun address_of(account: &signer): address {
        signer::address_of(account)
    }
}