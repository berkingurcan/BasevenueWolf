// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GameProduct
 * @dev Implementation of a custom ERC20 token for game products/currency
 */
contract GameProduct is ERC20 {
    /**
     * @dev Constructor that gives the specified address all of the tokens
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of tokens (in the smallest unit)
     * @param owner The address to receive the initial supply
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
} 