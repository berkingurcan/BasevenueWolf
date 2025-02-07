// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, initialSupply * 10 ** decimals());
    }
}

contract ERC20Deployer is Ownable {
    event TokenDeployed(address tokenAddress, string name, string symbol, uint256 initialSupply);

    constructor() Ownable(msg.sender) {}

    function deployToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public returns (address) {
        SimpleToken newToken = new SimpleToken(
            name,
            symbol,
            initialSupply,
            msg.sender
        );
        
        emit TokenDeployed(address(newToken), name, symbol, initialSupply);
        return address(newToken);
    }
} 