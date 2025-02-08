// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameProduct.sol";

/**
 * @title GameProductDeployer
 * @dev A contract to deploy new GameProduct (ERC20) contracts
 */
contract GameProductDeployer {
    event GameProductDeployed(address indexed tokenAddress, address indexed deployer);

    /**
     * @notice Deploys a new GameProduct token contract
     * @param name The name of the token
     * @param symbol The token symbol
     * @param amount The initial supply to be minted (in the smallest unit)
     * @param mintAddress The address to receive the initial minted tokens
     * @return tokenAddress The address of the newly deployed token contract
     */
    function deployGameProduct(
        string memory name,
        string memory symbol,
        uint256 amount,
        address mintAddress
    ) public returns (address tokenAddress) {
        GameProduct token = new GameProduct(name, symbol, amount, mintAddress);
        
        emit GameProductDeployed(address(token), msg.sender);
        
        return address(token);
    }
} 