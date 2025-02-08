import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("CustomERC20", function () {
  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TST";
  const INITIAL_SUPPLY = parseEther("1000000");

  async function deployCustomERC20() {
    const [deployer, recipient] = await hre.viem.getWalletClients();
    
    const token = await hre.viem.deployContract("CustomERC20", [
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      deployer.account.address,
    ]);

    return { token, deployer, recipient };
  }

  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      const { token } = await deployCustomERC20();
      
      expect(await token.read.name()).to.equal(TOKEN_NAME);
      expect(await token.read.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should mint the initial supply to the specified address", async function () {
      const { token, deployer } = await deployCustomERC20();
      
      const balance = await token.read.balanceOf([deployer.account.address]);
      expect(balance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the total supply correctly", async function () {
      const { token } = await deployCustomERC20();
      
      const totalSupply = await token.read.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, deployer, recipient } = await deployCustomERC20();
      const transferAmount = parseEther("100");

      await token.write.transfer(
        [recipient.account.address, transferAmount],
        { account: deployer.account.address }
      );

      const recipientBalance = await token.read.balanceOf([recipient.account.address]);
      expect(recipientBalance).to.equal(transferAmount);

      const deployerBalance = await token.read.balanceOf([deployer.account.address]);
      expect(deployerBalance).to.equal(INITIAL_SUPPLY - transferAmount);
    });

    it("Should fail when trying to transfer more than balance", async function () {
      const { token, deployer, recipient } = await deployCustomERC20();
      const exceedingAmount = INITIAL_SUPPLY + parseEther("1");

      await expect(
        token.write.transfer(
          [recipient.account.address, exceedingAmount],
          { account: deployer.account.address }
        )
      ).to.be.rejected;
    });
  });

  describe("Allowances", function () {
    it("Should approve and allow transferFrom", async function () {
      const { token, deployer, recipient } = await deployCustomERC20();
      const approvalAmount = parseEther("100");

      await token.write.approve(
        [recipient.account.address, approvalAmount],
        { account: deployer.account.address }
      );

      const allowance = await token.read.allowance([
        deployer.account.address,
        recipient.account.address,
      ]);
      expect(allowance).to.equal(approvalAmount);

      await token.write.transferFrom(
        [deployer.account.address, recipient.account.address, approvalAmount],
        { account: recipient.account.address }
      );

      const recipientBalance = await token.read.balanceOf([recipient.account.address]);
      expect(recipientBalance).to.equal(approvalAmount);

      const newAllowance = await token.read.allowance([
        deployer.account.address,
        recipient.account.address,
      ]);
      expect(newAllowance).to.equal(0n);
    });

    it("Should fail when trying to transferFrom more than allowed", async function () {
      const { token, deployer, recipient } = await deployCustomERC20();
      const approvalAmount = parseEther("100");
      const transferAmount = approvalAmount + parseEther("1");

      await token.write.approve(
        [recipient.account.address, approvalAmount],
        { account: deployer.account.address }
      );

      await expect(
        token.write.transferFrom(
          [deployer.account.address, recipient.account.address, transferAmount],
          { account: recipient.account.address }
        )
      ).to.be.rejected;
    });
  });
}); 