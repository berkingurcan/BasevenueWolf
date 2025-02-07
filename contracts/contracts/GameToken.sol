// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    string private _tokenURI;

    constructor(
        string memory name,
        string memory symbol,
        string memory tokenURI_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _tokenURI = tokenURI_;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function tokenURI() public view returns (string memory) {
        return _tokenURI;
    }

    function setTokenURI(string memory newTokenURI) public onlyOwner {
        _tokenURI = newTokenURI;
    }
} 