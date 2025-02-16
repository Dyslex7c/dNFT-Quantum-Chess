// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT {
    uint256 private _tokenIds;
    address contractAddress;

    // Enum for NFT tiers
    enum Tier { COMMON, RARE, EPIC, LEGENDARY }

    // Struct to store NFT metadata
    struct NFTMetadata {
        string name;
        uint256 weight;
        Tier tier;
        string ipfsHash;
    }

    // Mapping from tokenId to metadata
    mapping(uint256 => NFTMetadata) private _tokenMetadata;

    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        string name,
        uint256 weight,
        Tier tier,
        string ipfsHash,
        address owner
    );

    constructor(address marketplaceAddress) ERC721("Metaverse Tokens", "METT") {
        contractAddress = marketplaceAddress;
    }

    function createToken(
        string memory name,
        uint256 weight,
        Tier tier,
        string memory ipfsHash
    ) public returns (uint) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(name).length > 0, "Name cannot be empty");

        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(msg.sender, newItemId);
        
        // Store metadata
        _tokenMetadata[newItemId] = NFTMetadata(
            name,
            weight,
            tier,
            ipfsHash
        );

        // Set token URI to IPFS hash
        _setTokenURI(newItemId, ipfsHash);
        
        // Approve marketplace
        setApprovalForAll(contractAddress, true);

        emit NFTMinted(newItemId, name, weight, tier, ipfsHash, msg.sender);
        emit Transfer(address(0), msg.sender, newItemId);

        return newItemId;
    }

    // Get NFT metadata
    function getNFTMetadata(uint256 tokenId) public view returns (
        string memory name,
        uint256 weight,
        Tier tier,
        string memory ipfsHash
    ) {
        require(_exists(tokenId), "NFT does not exist");
        NFTMetadata storage metadata = _tokenMetadata[tokenId];
        return (
            metadata.name,
            metadata.weight,
            metadata.tier,
            metadata.ipfsHash
        );
    }
}