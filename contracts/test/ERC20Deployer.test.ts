import { expect } from "chai";
import hre from "hardhat";
import { formatEther, parseEther, Log, getAddress } from "viem";

describe("ERC20Deployer", function () {
  async function deployERC20Deployer() {
    const [deployer, user] = await hre.viem.getWalletClients();
    const erc20Deployer = await hre.viem.deployContract("ERC20Deployer");

    return { erc20Deployer, deployer, user };
  }

  describe("Token Deployment", function () {
    it("Should deploy a new token with correct parameters", async function () {
      const { erc20Deployer, deployer } = await deployERC20Deployer();
      
      const tokenName = "Test Token";
      const tokenSymbol = "TST";
      const initialSupply = parseEther("1000000");

      const tx = await erc20Deployer.write.deployToken([
        tokenName,
        tokenSymbol,
        initialSupply,
        deployer.account.address,
      ]);

      // Get the token address from the event logs
      const client = await hre.viem.getPublicClient();
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      const event = receipt.logs.find(
        (log: Log) => log.address.toLowerCase() === erc20Deployer.address.toLowerCase()
      );

      expect(event).to.not.be.undefined;
      if (!event || !event.topics[1]) throw new Error("Event not found");
      
      const tokenAddress = getAddress(`0x${event.topics[1].slice(26)}`);
      const token = await hre.viem.getContractAt("CustomERC20", tokenAddress);

      // Verify token parameters
      expect(await token.read.name()).to.equal(tokenName);
      expect(await token.read.symbol()).to.equal(tokenSymbol);
      expect(await token.read.totalSupply()).to.equal(initialSupply);
      expect(await token.read.balanceOf([deployer.account.address])).to.equal(initialSupply);
    });

    it("Should emit TokenDeployed event", async function () {
      const { erc20Deployer, deployer } = await deployERC20Deployer();
      
      const tx = await erc20Deployer.write.deployToken([
        "Test Token",
        "TST",
        parseEther("1000000"),
        deployer.account.address,
      ]);

      const client = await hre.viem.getPublicClient();
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      const event = receipt.logs.find(
        (log: Log) => log.address.toLowerCase() === erc20Deployer.address.toLowerCase()
      );

      expect(event).to.not.be.undefined;
      if (!event || !event.topics[1] || !event.topics[2]) throw new Error("Event not found");

      // Verify event parameters
      const tokenAddress = getAddress(`0x${event.topics[1].slice(26)}`);
      const deployerAddress = getAddress(`0x${event.topics[2].slice(26)}`);
      expect(deployerAddress.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
    });

    it("Should allow multiple token deployments", async function () {
      const { erc20Deployer, deployer } = await deployERC20Deployer();
      
      // Deploy first token
      await erc20Deployer.write.deployToken([
        "First Token",
        "FIRST",
        parseEther("1000000"),
        deployer.account.address,
      ]);

      // Deploy second token
      await erc20Deployer.write.deployToken([
        "Second Token",
        "SECOND",
        parseEther("2000000"),
        deployer.account.address,
      ]);

      // Both deployments should succeed without errors
    });
  });
}); 