// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title GameItem
 * @dev Implementation of a custom ERC721 token for game items with URI storage
 */
contract GameItem is ERC721URIStorage {
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    /**
     * @dev Constructor that sets the name and symbol of the token
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param baseURI The base URI for token metadata (optional)
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Mints a new token
     * @param to The address that will own the minted token
     * @return uint256 ID of the newly minted token
     */
    function mint(address to, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }
        return tokenId;
    }
}
