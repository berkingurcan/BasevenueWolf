import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("GameItem", function () {
  async function deployGameItemFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const gameItem = await hre.viem.deployContract("GameItem", [
      "Wolf Pack NFT",
      "WOLF",
      "https://api.yourgame.com/nft/",
    ]);

    return { gameItem, owner, otherAccount, publicClient };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { gameItem } = await loadFixture(deployGameItemFixture);

      const name = await gameItem.read.name();
      const symbol = await gameItem.read.symbol();

      expect(name).to.equal("Wolf Pack NFT");
      expect(symbol).to.equal("WOLF");
    });

    it("Should have correct base URI", async function () {
      const { gameItem, owner, publicClient } = await loadFixture(
        deployGameItemFixture,
      );

      // Mint a token first to test URI
      const tx = await gameItem.write.mint([owner.account.address, ""]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const tokenURI = await gameItem.read.tokenURI([0n]);
      expect(tokenURI).to.equal("https://api.yourgame.com/nft/0");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token with incremental ID", async function () {
      const { gameItem, owner, publicClient } = await loadFixture(
        deployGameItemFixture,
      );

      const tx = await gameItem.write.mint([owner.account.address, ""]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const tokenOwner = await gameItem.read.ownerOf([0n]);
      expect(getAddress(tokenOwner)).to.equal(
        getAddress(owner.account.address),
      );
    });

    it("Should mint multiple tokens with incremental IDs", async function () {
      const { gameItem, owner, publicClient } = await loadFixture(
        deployGameItemFixture,
      );

      // Mint first token
      const tx1 = await gameItem.write.mint([owner.account.address, ""]);
      await publicClient.waitForTransactionReceipt({ hash: tx1 });

      // Mint second token
      const tx2 = await gameItem.write.mint([owner.account.address, ""]);
      await publicClient.waitForTransactionReceipt({ hash: tx2 });

      const owner0 = await gameItem.read.ownerOf([0n]);
      const owner1 = await gameItem.read.ownerOf([1n]);

      expect(getAddress(owner0)).to.equal(getAddress(owner.account.address));
      expect(getAddress(owner1)).to.equal(getAddress(owner.account.address));
    });

    it("Should mint with custom token URI", async function () {
      const { gameItem, owner, publicClient } = await loadFixture(
        deployGameItemFixture,
      );

      const customURI = "ipfs://QmCustomMetadata";
      const tx = await gameItem.write.mint([owner.account.address, customURI]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const tokenURI = await gameItem.read.tokenURI([0n]);
      expect(tokenURI).to.equal(customURI);
    });
  });

  describe("Token URI", function () {
    it("Should use base URI when token URI is empty", async function () {
      const { gameItem, owner, publicClient } = await loadFixture(
        deployGameItemFixture,
      );

      const tx = await gameItem.write.mint([owner.account.address, ""]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const tokenURI = await gameItem.read.tokenURI([0n]);
      expect(tokenURI).to.equal("https://api.yourgame.com/nft/0");
    });

    it("Should use custom URI when provided", async function () {
      const { gameItem, owner, publicClient } = await loadFixture(
        deployGameItemFixture,
      );

      const customURI = "ipfs://QmCustomMetadata";
      const tx = await gameItem.write.mint([owner.account.address, customURI]);
      await publicClient.waitForTransactionReceipt({ hash: tx });

      const tokenURI = await gameItem.read.tokenURI([0n]);
      expect(tokenURI).to.equal(customURI);
    });
  });
});
