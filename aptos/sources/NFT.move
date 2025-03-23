module nft_addr::DynamicNFT {
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;
    
    // Metadata structure for the Dynamic NFT
    struct NFTMetadata has store, drop, copy {
        name: String,
        trait: String,
        weight: u64,  // Mutable property
        image_ipfs_hash: String
    }
    
    // Custom implementation of the NFT with metadata
    struct TokenData has store {
        id: u64,
        metadata: NFTMetadata,
        owner: address
    }
    
    struct DynamicNFT has key {
        token_ids: u64,
        marketplace_address: address,
        used_token_names: vector<String>,
        owner: address,
        tokens: vector<TokenData>
    }

    struct NFTMintedEvent has drop, store {
        token_id: u64,
        name: String,
        trait: String,
        weight: u64,
        image_ipfs_hash: String,
        owner: address,
        timestamp: u64
    }

    struct NFTUpdatedEvent has drop, store {
        token_id: u64,
        name: String,
        weight: u64,
        timestamp: u64
    }

    // Events
    struct EventStore has key {
        nft_minted_events: EventHandle<NFTMintedEvent>,
        nft_updated_events: EventHandle<NFTUpdatedEvent>
    }
    
    // Reentrancy guard replacement
    struct Guard has key {
        locked: bool
    }

    // Add public accessor functions for NFTMetadata fields
    public fun get_metadata_name(metadata: &NFTMetadata): String {
        metadata.name
    }

    public fun get_metadata_trait(metadata: &NFTMetadata): String {
        metadata.trait
    }

    public fun get_metadata_weight(metadata: &NFTMetadata): u64 {
        metadata.weight
    }

    public fun get_metadata_image_ipfs_hash(metadata: &NFTMetadata): String {
        metadata.image_ipfs_hash
    }

    public entry fun initialize(account: &signer, marketplace_address: address) {
        let sender = address_of(account);
        
        assert!(marketplace_address != @0x0, 101); // Invalid marketplace address
        
        // Initialize NFT contract
        let nft = DynamicNFT {
            token_ids: 0,
            marketplace_address: marketplace_address,
            used_token_names: vector::empty<String>(),
            owner: sender,
            tokens: vector::empty<TokenData>()
        };
        
        let event_store = EventStore {
            nft_minted_events: account::new_event_handle<NFTMintedEvent>(account),
            nft_updated_events: account::new_event_handle<NFTUpdatedEvent>(account)
        };
        
        let guard = Guard {
            locked: false
        };
        
        move_to(account, nft);
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

    public entry fun create_token(
        account: &signer, 
        name: String,
        trait: String,
        weight: u64,
        image_ipfs_hash: String
    ) acquires DynamicNFT, EventStore, Guard {
        let sender = address_of(account);
        
        acquire(account);
        
        assert!(string::length(&name) > 0, 102); // Name cannot be empty
        assert!(string::length(&trait) > 0, 103); // Trait cannot be empty
        assert!(string::length(&image_ipfs_hash) > 0, 104); // Image IPFS hash cannot be empty
        
        let nft = borrow_global_mut<DynamicNFT>(sender);
        
        // Check if token name is already used
        let i = 0;
        let name_len = vector::length(&nft.used_token_names);
        while (i < name_len) {
            let existing_name = vector::borrow(&nft.used_token_names, i);
            assert!(*existing_name != name, 105); // Token name already used
            i = i + 1;
        };
        
        // Increment token ID
        nft.token_ids = nft.token_ids + 1;
        let new_item_id = nft.token_ids;
        
        // Add name to used list
        vector::push_back(&mut nft.used_token_names, name);
        
        // Create metadata
        let metadata = NFTMetadata {
            name: name,
            trait: trait,
            weight: weight,
            image_ipfs_hash: image_ipfs_hash
        };
        
        // Create and store new token
        let token = TokenData {
            id: new_item_id,
            metadata: metadata,
            owner: sender
        };
        
        vector::push_back(&mut nft.tokens, token);
        
        // Emit event
        let event_store = borrow_global_mut<EventStore>(sender);
        event::emit_event(
            &mut event_store.nft_minted_events,
            NFTMintedEvent {
                token_id: new_item_id,
                name: name,
                trait: trait,
                weight: weight,
                image_ipfs_hash: image_ipfs_hash,
                owner: sender,
                timestamp: timestamp::now_seconds()
            }
        );
        
        release(account);
    }

    // Update the weight (mutable property) of the NFT
    public entry fun update_weight(
        account: &signer,
        token_id: u64,
        new_weight: u64
    ) acquires DynamicNFT, EventStore, Guard {
        let sender = address_of(account);
        
        acquire(account);
        
        assert!(exists<DynamicNFT>(sender), 106); // NFT resource doesn't exist
        
        let nft = borrow_global_mut<DynamicNFT>(sender);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 107); // Token not found
        
        let token = vector::borrow_mut(&mut nft.tokens, index);
        assert!(token.owner == sender, 108); // Not token owner
        
        // Update weight
        token.metadata.weight = new_weight;
        
        // Emit update event
        let event_store = borrow_global_mut<EventStore>(sender);
        event::emit_event(
            &mut event_store.nft_updated_events,
            NFTUpdatedEvent {
                token_id: token_id,
                name: token.metadata.name,
                weight: new_weight,
                timestamp: timestamp::now_seconds()
            }
        );
        
        release(account);
    }
    
    // Helper function to find token
    fun find_token_index(tokens: &vector<TokenData>, token_id: u64): (bool, u64) {
        let i = 0;
        let len = vector::length(tokens);
        
        while (i < len) {
            let token = vector::borrow(tokens, i);
            if (token.id == token_id) {
                return (true, i)
            };
            i = i + 1;
        };
        
        (false, 0)
    }
    
    // Transfer token from one address to another
    public fun transfer_token(from_address: address, to_address: address, token_id: u64) acquires DynamicNFT {
        assert!(exists<DynamicNFT>(from_address), 109); // NFT resource doesn't exist
        
        let nft = borrow_global_mut<DynamicNFT>(from_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 110); // Token not found
        
        let token = vector::borrow_mut(&mut nft.tokens, index);
        assert!(token.owner == from_address, 111); // Not token owner
        
        // Update token owner
        token.owner = to_address;
    }

    #[view]
    public fun get_user_tokens(
        owner_address: address
    ): (vector<u64>, vector<NFTMetadata>) acquires DynamicNFT {
        assert!(owner_address != @0x0, 112); // Invalid owner address
        
        let token_ids = vector::empty<u64>();
        let token_metadata = vector::empty<NFTMetadata>();
        
        // Check if the address has NFT resources
        if (!exists<DynamicNFT>(owner_address)) {
            return (token_ids, token_metadata)
        };
        
        let nft = borrow_global<DynamicNFT>(owner_address);
        let i = 0;
        let len = vector::length(&nft.tokens);
        
        while (i < len) {
            let token = vector::borrow(&nft.tokens, i);
            if (token.owner == owner_address) {
                vector::push_back(&mut token_ids, token.id);
                vector::push_back(&mut token_metadata, token.metadata);
            };
            i = i + 1;
        };
        
        (token_ids, token_metadata)
    }

    public fun verify_token_ownership(
        token_id: u64, 
        owner_address: address
    ): bool acquires DynamicNFT {
        if (!exists<DynamicNFT>(owner_address)) {
            return false
        };
        
        let nft = borrow_global<DynamicNFT>(owner_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        
        if (!found) {
            return false
        };
        
        let token = vector::borrow(&nft.tokens, index);
        token.owner == owner_address
    }
    
    // Get token metadata by ID
    public fun token_metadata(contract_address: address, token_id: u64): NFTMetadata acquires DynamicNFT {
        assert!(exists<DynamicNFT>(contract_address), 113); // NFT resource doesn't exist
        
        let nft = borrow_global<DynamicNFT>(contract_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 114); // Token not found
        
        let token = vector::borrow(&nft.tokens, index);
        token.metadata
    }
    
    // Find token owner
    public fun owner_of(contract_address: address, token_id: u64): address acquires DynamicNFT {
        assert!(exists<DynamicNFT>(contract_address), 115); // NFT resource doesn't exist
        
        let nft = borrow_global<DynamicNFT>(contract_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 116); // Token not found
        
        let token = vector::borrow(&nft.tokens, index);
        token.owner
    }

    // Helper function to get signer address
    fun address_of(account: &signer): address {
        std::signer::address_of(account)
    }
}