// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721URIStorage, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Marketplace contract address
    address private immutable _marketplaceAddress;
    
    // Mapping to track if a token URI has been used
    mapping(string => bool) private _usedTokenURIs;
    
    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        string tokenURI,
        address indexed owner,
        uint256 timestamp
    );
    
    constructor(address marketplaceAddress) ERC721("Chess Test Tokens", "CHTT") Ownable(msg.sender) {
        require(marketplaceAddress != address(0), "Invalid marketplace address");
        _marketplaceAddress = marketplaceAddress;
    }

    function createToken(string memory tokenURI) 
        public 
        nonReentrant 
        returns (uint256) 
    {
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        require(!_usedTokenURIs[tokenURI], "Token URI already used");
        
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        
        _usedTokenURIs[tokenURI] = true;
        
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        if (!isApprovedForAll(msg.sender, _marketplaceAddress)) {
            setApprovalForAll(_marketplaceAddress, true);
        }
        
        emit NFTMinted(newItemId, tokenURI, msg.sender, block.timestamp);
        
        return newItemId;
    }

    function getUserTokens(address owner) 
        public 
        view 
        returns (uint256[] memory tokenIds, string[] memory tokenURIs) 
    {
        require(owner != address(0), "Invalid owner address");
        
        uint256 ownerTokenCount = balanceOf(owner);
        require(ownerTokenCount > 0, "No tokens owned by this address");
        
        tokenIds = new uint256[](ownerTokenCount);
        tokenURIs = new string[](ownerTokenCount);
        
        uint256 tokenCount = 0;
        uint256 maxTokenId = _tokenIds.current();
        
        for(uint256 id = 1; id <= maxTokenId && tokenCount < ownerTokenCount; id++) {
            try this.ownerOf(id) returns (address tokenOwner) {
                if (tokenOwner == owner) {
                    try this.tokenURI(id) returns (string memory uri) {
                        require(bytes(uri).length > 0, "Invalid token URI");
                        
                        tokenIds[tokenCount] = id;
                        tokenURIs[tokenCount] = uri;
                        tokenCount++;
                    } catch {
                        continue;
                    }
                }
            } catch {
                continue;
            }
        }
        
        require(tokenCount > 0, "No valid tokens found");
        return (tokenIds, tokenURIs);
    }

    function verifyTokenOwnership(uint256 tokenId, address owner) 
        public 
        view 
        returns (bool) 
    {
        try this.ownerOf(tokenId) returns (address tokenOwner) {
            return tokenOwner == owner;
        } catch {
            return false;
        }
    }

    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 tokenId,
    //     uint256 batchSize
    // ) internal override {
    //     super._beforeTokenTransfer(from, to, tokenId, batchSize);
    //     require(to != address(0), "Cannot transfer to zero address");
    // }
}