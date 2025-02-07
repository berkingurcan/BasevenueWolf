const hre = require("hardhat");

async function main() {
  console.log("Deploying GameTokenFactory...");

  const GameTokenFactory = await hre.ethers.getContractFactory("GameTokenFactory");
  const factory = await GameTokenFactory.deploy();

  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log(`GameTokenFactory deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 