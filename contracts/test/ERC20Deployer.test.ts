import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20Deployer, SimpleToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ERC20Deployer", function () {
  let deployer: ERC20Deployer;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TST";
  const INITIAL_SUPPLY = 1000000;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    const ERC20Deployer = await ethers.getContractFactory("ERC20Deployer");
    deployer = await ERC20Deployer.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await deployer.owner()).to.equal(owner.address);
    });
  });

  describe("Token Deployment", function () {
    it("Should deploy a new token with correct parameters", async function () {
      const tx = await deployer.deployToken(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);
      const receipt = await tx.wait();

      // Get the TokenDeployed event
      const event = receipt?.logs[1]; // The second event should be TokenDeployed
      const tokenAddress = event?.args?.[0];

      // Get the deployed token contract
      const SimpleToken = await ethers.getContractFactory("SimpleToken");
      const token = SimpleToken.attach(tokenAddress) as SimpleToken;

      // Verify token parameters
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY * BigInt(10 ** 18)); // Account for decimals
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY * BigInt(10 ** 18));
    });

    it("Should emit TokenDeployed event", async function () {
      await expect(deployer.deployToken(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY))
        .to.emit(deployer, "TokenDeployed")
        .withArgs(
          expect.any(String), // token address
          TOKEN_NAME,
          TOKEN_SYMBOL,
          INITIAL_SUPPLY
        );
    });

    it("Should allow any user to deploy tokens", async function () {
      const deployerConnectedToUser = deployer.connect(user);
      const tx = await deployerConnectedToUser.deployToken(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);
      const receipt = await tx.wait();

      const event = receipt?.logs[1];
      const tokenAddress = event?.args?.[0];

      const SimpleToken = await ethers.getContractFactory("SimpleToken");
      const token = SimpleToken.attach(tokenAddress) as SimpleToken;

      // Verify tokens were minted to the user, not the contract owner
      expect(await token.balanceOf(user.address)).to.equal(INITIAL_SUPPLY * BigInt(10 ** 18));
      expect(await token.balanceOf(owner.address)).to.equal(0);
    });
  });

  describe("Deployed Token", function () {
    let token: SimpleToken;

    beforeEach(async function () {
      const tx = await deployer.deployToken(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);
      const receipt = await tx.wait();
      const event = receipt?.logs[1];
      const tokenAddress = event?.args?.[0];

      const SimpleToken = await ethers.getContractFactory("SimpleToken");
      token = SimpleToken.attach(tokenAddress) as SimpleToken;
    });

    it("Should allow token transfers", async function () {
      const transferAmount = BigInt(1000) * BigInt(10 ** 18);
      await token.transfer(user.address, transferAmount);
      expect(await token.balanceOf(user.address)).to.equal(transferAmount);
    });

    it("Should handle decimals correctly", async function () {
      expect(await token.decimals()).to.equal(18);
    });
  });
}); 