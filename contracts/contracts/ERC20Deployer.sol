// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin's ERC20 standard implementation.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./CustomERC20.sol";

/**
 * @title ERC20Deployer
 * @dev A contract to deploy new CustomERC20 contracts.
 */
contract ERC20Deployer {
    event TokenDeployed(address indexed tokenAddress, address indexed deployer);

    /**
     * @notice Deploys a new CustomERC20 token contract.
     * @param name The name of the token.
     * @param symbol The token symbol.
     * @param amount The initial supply to be minted (in the smallest unit).
     * @param mintAddress The address to receive the initial minted tokens.
     * @return tokenAddress The address of the newly deployed token contract.
     */
    function deployToken(
        string memory name,
        string memory symbol,
        uint256 amount,
        address mintAddress
    )
        public
        returns (address tokenAddress)
    {
        CustomERC20 token = new CustomERC20(name, symbol, amount, mintAddress);

        emit TokenDeployed(address(token), msg.sender);

        return address(token);
    }
}
