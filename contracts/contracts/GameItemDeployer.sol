// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameItem.sol";

/**
 * @title GameItemDeployer
 * @dev A contract to deploy new GameItem (ERC721) contracts
 */
contract GameItemDeployer {
    event GameItemDeployed(address indexed tokenAddress, address indexed deployer);

    /**
     * @notice Deploys a new GameItem token contract
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param baseURI The base URI for token metadata (optional)
     * @return tokenAddress The address of the newly deployed token contract
     */
    function deployGameItem(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) public returns (address tokenAddress) {
        GameItem token = new GameItem(name, symbol, baseURI);
        
        emit GameItemDeployed(address(token), msg.sender);
        
        return address(token);
    }
}
