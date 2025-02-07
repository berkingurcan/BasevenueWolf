import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ERC20Deployer...");

  const ERC20Deployer = await ethers.getContractFactory("ERC20Deployer");
  const deployer = await ERC20Deployer.deploy();
  await deployer.waitForDeployment();

  const deployerAddress = await deployer.getAddress();
  console.log(`ERC20Deployer deployed to: ${deployerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 