// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameTokenFactory is Ownable {
    event TokenCreated(address tokenAddress, string name, string symbol, address owner);

    constructor() Ownable(msg.sender) {}

    function createToken(
        string memory name,
        string memory symbol,
        string memory tokenURI
    ) external returns (address) {
        GameToken token = new GameToken(name, symbol, tokenURI);
        token.transferOwnership(msg.sender);
        
        emit TokenCreated(address(token), name, symbol, msg.sender);
        return address(token);
    }
} 