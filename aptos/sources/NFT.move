module 0x71940f0f7409ef0324c67cca8c9c191682118b19df6b7e2852ffcd23a0d407a1::NFT {
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;
    
    // Custom implementation instead of Ethereum's ERC721
    struct TokenData has store {
        id: u64,
        uri: String,
        owner: address
    }
    
    struct NFT has key {
        token_ids: u64,
        marketplace_address: address,
        used_token_uris: vector<String>,
        owner: address,
        tokens: vector<TokenData>
    }

    struct NFTMintedEvent has drop, store {
        token_id: u64,
        token_uri: String,
        owner: address,
        timestamp: u64
    }

    // Events
    struct EventStore has key {
        nft_minted_events: EventHandle<NFTMintedEvent>
    }
    
    // Reentrancy guard replacement
    struct Guard has key {
        locked: bool
    }

    public entry fun initialize(account: &signer, marketplace_address: address) {
        let sender = address_of(account);
        
        assert!(marketplace_address != @0x0, 101); // Invalid marketplace address
        
        // Initialize NFT contract
        let nft = NFT {
            token_ids: 0,
            marketplace_address: marketplace_address,
            used_token_uris: vector::empty<String>(),
            owner: sender,
            tokens: vector::empty<TokenData>()
        };
        
        let event_store = EventStore {
            nft_minted_events: account::new_event_handle<NFTMintedEvent>(account)
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
        token_uri: String
    ) acquires NFT, EventStore, Guard {
        let sender = address_of(account);
        
        acquire(account);
        
        assert!(string::length(&token_uri) > 0, 102); // Token URI cannot be empty
        
        let nft = borrow_global_mut<NFT>(sender);
        
        // Check if token URI is already used
        let i = 0;
        let uri_len = vector::length(&nft.used_token_uris);
        while (i < uri_len) {
            let existing_uri = vector::borrow(&nft.used_token_uris, i);
            assert!(*existing_uri != token_uri, 103); // Token URI already used
            i = i + 1;
        };
        
        // Increment token ID
        nft.token_ids = nft.token_ids + 1;
        let new_item_id = nft.token_ids;
        
        // Add URI to used list
        vector::push_back(&mut nft.used_token_uris, token_uri);
        
        // Create and store new token
        let token = TokenData {
            id: new_item_id,
            uri: token_uri,
            owner: sender
        };
        
        vector::push_back(&mut nft.tokens, token);
        
        // Emit event
        let event_store = borrow_global_mut<EventStore>(sender);
        event::emit_event(
            &mut event_store.nft_minted_events,
            NFTMintedEvent {
                token_id: new_item_id,
                token_uri: token_uri,
                owner: sender,
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
    public fun transfer_token(from_address: address, to_address: address, token_id: u64) acquires NFT {
        assert!(exists<NFT>(from_address), 104); // NFT resource doesn't exist
        
        let nft = borrow_global_mut<NFT>(from_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 105); // Token not found
        
        let token = vector::borrow_mut(&mut nft.tokens, index);
        assert!(token.owner == from_address, 106); // Not token owner
        
        // Update token owner
        token.owner = to_address;
    }

    public fun get_user_tokens(
        owner_address: address
    ): (vector<u64>, vector<String>) acquires NFT {
        assert!(owner_address != @0x0, 107); // Invalid owner address
        
        let token_ids = vector::empty<u64>();
        let token_uris = vector::empty<String>();
        
        // Check if the address has NFT resources
        if (!exists<NFT>(owner_address)) {
            return (token_ids, token_uris)
        };
        
        let nft = borrow_global<NFT>(owner_address);
        let i = 0;
        let len = vector::length(&nft.tokens);
        
        while (i < len) {
            let token = vector::borrow(&nft.tokens, i);
            if (token.owner == owner_address) {
                vector::push_back(&mut token_ids, token.id);
                vector::push_back(&mut token_uris, token.uri);
            };
            i = i + 1;
        };
        
        (token_ids, token_uris)
    }

    public fun verify_token_ownership(
        token_id: u64, 
        owner_address: address
    ): bool acquires NFT {
        if (!exists<NFT>(owner_address)) {
            return false
        };
        
        let nft = borrow_global<NFT>(owner_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        
        if (!found) {
            return false
        };
        
        let token = vector::borrow(&nft.tokens, index);
        token.owner == owner_address
    }
    
    // Find a token by ID
    public fun token_uri(contract_address: address, token_id: u64): String acquires NFT {
        assert!(exists<NFT>(contract_address), 108); // NFT resource doesn't exist
        
        let nft = borrow_global<NFT>(contract_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 109); // Token not found
        
        let token = vector::borrow(&nft.tokens, index);
        token.uri
    }
    
    // Find token owner
    public fun owner_of(contract_address: address, token_id: u64): address acquires NFT {
        assert!(exists<NFT>(contract_address), 110); // NFT resource doesn't exist
        
        let nft = borrow_global<NFT>(contract_address);
        let (found, index) = find_token_index(&nft.tokens, token_id);
        assert!(found, 111); // Token not found
        
        let token = vector::borrow(&nft.tokens, index);
        token.owner
    }

    // Helper function to get signer address
    fun address_of(account: &signer): address {
        std::signer::address_of(account)
    }
}