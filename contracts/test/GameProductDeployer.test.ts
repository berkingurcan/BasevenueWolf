import { expect } from "chai";
import hre from "hardhat";
import { formatEther, parseEther, Log, getAddress } from "viem";

describe("GameProductDeployer", function () {
  async function deployGameProductDeployer() {
    const [deployer, user] = await hre.viem.getWalletClients();
    const gameProductDeployer = await hre.viem.deployContract(
      "GameProductDeployer",
    );

    return { gameProductDeployer, deployer, user };
  }

  describe("Token Deployment", function () {
    it("Should deploy a new game product token with correct parameters", async function () {
      const { gameProductDeployer, deployer } =
        await deployGameProductDeployer();

      const tokenName = "Game Gold";
      const tokenSymbol = "GOLD";
      const initialSupply = parseEther("1000000");

      const tx = await gameProductDeployer.write.deployGameProduct([
        tokenName,
        tokenSymbol,
        initialSupply,
        deployer.account.address,
      ]);

      // Get the token address from the event logs
      const client = await hre.viem.getPublicClient();
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      const event = receipt.logs.find(
        (log: Log) =>
          log.address.toLowerCase() ===
          gameProductDeployer.address.toLowerCase(),
      );

      expect(event).to.not.be.undefined;
      if (!event || !event.topics[1]) throw new Error("Event not found");

      const tokenAddress = getAddress(`0x${event.topics[1].slice(26)}`);
      const token = await hre.viem.getContractAt("GameProduct", tokenAddress);

      // Verify token parameters
      expect(await token.read.name()).to.equal(tokenName);
      expect(await token.read.symbol()).to.equal(tokenSymbol);
      expect(await token.read.totalSupply()).to.equal(initialSupply);
      expect(await token.read.balanceOf([deployer.account.address])).to.equal(
        initialSupply,
      );
    });

    it("Should emit GameProductDeployed event", async function () {
      const { gameProductDeployer, deployer } =
        await deployGameProductDeployer();

      const tx = await gameProductDeployer.write.deployGameProduct([
        "Game Gold",
        "GOLD",
        parseEther("1000000"),
        deployer.account.address,
      ]);

      const client = await hre.viem.getPublicClient();
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      const event = receipt.logs.find(
        (log: Log) =>
          log.address.toLowerCase() ===
          gameProductDeployer.address.toLowerCase(),
      );

      expect(event).to.not.be.undefined;
      if (!event || !event.topics[1] || !event.topics[2])
        throw new Error("Event not found");

      // Verify event parameters
      const tokenAddress = getAddress(`0x${event.topics[1].slice(26)}`);
      const deployerAddress = getAddress(`0x${event.topics[2].slice(26)}`);
      expect(deployerAddress).to.equal(getAddress(deployer.account.address));
    });

    it("Should allow multiple token deployments", async function () {
      const { gameProductDeployer, deployer } =
        await deployGameProductDeployer();

      // Deploy first token (Game Gold)
      await gameProductDeployer.write.deployGameProduct([
        "Game Gold",
        "GOLD",
        parseEther("1000000"),
        deployer.account.address,
      ]);

      // Deploy second token (Game Gems)
      await gameProductDeployer.write.deployGameProduct([
        "Game Gems",
        "GEM",
        parseEther("2000000"),
        deployer.account.address,
      ]);

      // Both deployments should succeed without errors
    });

    it("Should deploy tokens with different supplies", async function () {
      const { gameProductDeployer, deployer } =
        await deployGameProductDeployer();

      const firstSupply = parseEther("1000000");
      const secondSupply = parseEther("2000000");

      // Deploy first token
      const tx1 = await gameProductDeployer.write.deployGameProduct([
        "First Token",
        "FIRST",
        firstSupply,
        deployer.account.address,
      ]);

      // Deploy second token
      const tx2 = await gameProductDeployer.write.deployGameProduct([
        "Second Token",
        "SECOND",
        secondSupply,
        deployer.account.address,
      ]);

      // Get token addresses from events
      const client = await hre.viem.getPublicClient();
      const receipt1 = await client.waitForTransactionReceipt({ hash: tx1 });
      const receipt2 = await client.waitForTransactionReceipt({ hash: tx2 });

      const event1 = receipt1.logs.find(
        (log: Log) =>
          log.address.toLowerCase() ===
          gameProductDeployer.address.toLowerCase(),
      );
      const event2 = receipt2.logs.find(
        (log: Log) =>
          log.address.toLowerCase() ===
          gameProductDeployer.address.toLowerCase(),
      );

      expect(event1).to.not.be.undefined;
      expect(event2).to.not.be.undefined;
      if (!event1?.topics[1] || !event2?.topics[1])
        throw new Error("Events not found");

      const token1Address = getAddress(`0x${event1.topics[1].slice(26)}`);
      const token2Address = getAddress(`0x${event2.topics[1].slice(26)}`);

      const token1 = await hre.viem.getContractAt("GameProduct", token1Address);
      const token2 = await hre.viem.getContractAt("GameProduct", token2Address);

      // Verify different supplies
      expect(await token1.read.totalSupply()).to.equal(firstSupply);
      expect(await token2.read.totalSupply()).to.equal(secondSupply);
    });
  });
});
