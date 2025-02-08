import { expect } from "chai";
import hre from "hardhat";
import { getAddress, Log, PublicClient } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("GameItemDeployer", function () {
  async function deployGameItemDeployerFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const gameItemDeployer = await hre.viem.deployContract("GameItemDeployer");
    const publicClient = await hre.viem.getPublicClient();

    return { gameItemDeployer, owner, otherAccount, publicClient };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { gameItemDeployer } = await loadFixture(
        deployGameItemDeployerFixture,
      );
      expect(gameItemDeployer.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("GameItem Deployment", function () {
    it("Should deploy a new GameItem contract", async function () {
      const { gameItemDeployer, owner, publicClient } = await loadFixture(
        deployGameItemDeployerFixture,
      );

      const name = "Wolf Pack NFT";
      const symbol = "WOLF";
      const baseURI = "https://api.yourgame.com/nft/";

      const tx = await gameItemDeployer.write.deployGameItem([
        name,
        symbol,
        baseURI,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      // Find the deployment event
      const deployEvent = receipt.logs.find(
        (log: Log) =>
          log.address.toLowerCase() === gameItemDeployer.address.toLowerCase(),
      );

      expect(deployEvent).to.not.be.undefined;

      // Get the deployed GameItem address
      const gameItemAddress = `0x${deployEvent!.topics[1].slice(26)}`;
      expect(gameItemAddress).to.match(/^0x[a-fA-F0-9]{40}$/);

      // Create contract instance for the deployed GameItem
      const gameItem = await hre.viem.getContractAt(
        "GameItem",
        gameItemAddress as `0x${string}`,
      );

      // Verify the deployed contract's properties
      const deployedName = await gameItem.read.name();
      const deployedSymbol = await gameItem.read.symbol();
      expect(deployedName).to.equal(name);
      expect(deployedSymbol).to.equal(symbol);

      // Test minting and URI
      const mintTx = await gameItem.write.mint([owner.account.address, ""]);
      await publicClient.waitForTransactionReceipt({ hash: mintTx });
      const tokenURI = await gameItem.read.tokenURI([0n]);
      expect(tokenURI).to.equal(`${baseURI}0`);
    });

    it("Should emit GameItemDeployed event", async function () {
      const { gameItemDeployer, owner, publicClient } = await loadFixture(
        deployGameItemDeployerFixture,
      );

      const name = "Test NFT";
      const symbol = "TEST";
      const baseURI = "https://test.com/";

      const tx = await gameItemDeployer.write.deployGameItem([
        name,
        symbol,
        baseURI,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      // Verify event was emitted
      const deployEvent = receipt.logs.find(
        (log: Log) =>
          log.address.toLowerCase() === gameItemDeployer.address.toLowerCase(),
      );
      expect(deployEvent).to.not.be.undefined;

      // Verify event parameters
      const deployedAddress = `0x${deployEvent!.topics[1].slice(26)}`;
      const deployerAddress = `0x${deployEvent!.topics[2].slice(26)}`;

      expect(deployedAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(getAddress(deployerAddress)).to.equal(
        getAddress(owner.account.address),
      );
    });

    it("Should allow multiple deployments", async function () {
      const { gameItemDeployer, publicClient } = await loadFixture(
        deployGameItemDeployerFixture,
      );

      // First deployment
      const tx1 = await gameItemDeployer.write.deployGameItem([
        "First NFT",
        "FIRST",
        "https://first.com/",
      ]);
      const receipt1 = await publicClient.waitForTransactionReceipt({
        hash: tx1,
      });

      // Second deployment
      const tx2 = await gameItemDeployer.write.deployGameItem([
        "Second NFT",
        "SECOND",
        "https://second.com/",
      ]);
      const receipt2 = await publicClient.waitForTransactionReceipt({
        hash: tx2,
      });

      // Verify both deployments were successful
      const events1 = receipt1.logs.filter(
        (log: Log) =>
          log.address.toLowerCase() === gameItemDeployer.address.toLowerCase(),
      );
      const events2 = receipt2.logs.filter(
        (log: Log) =>
          log.address.toLowerCase() === gameItemDeployer.address.toLowerCase(),
      );

      expect(events1.length).to.equal(1);
      expect(events2.length).to.equal(1);

      const address1 = `0x${events1[0].topics[1].slice(26)}`;
      const address2 = `0x${events2[0].topics[1].slice(26)}`;

      expect(address1).to.not.equal(address2);
      expect(address1).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(address2).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});
