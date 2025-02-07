const hre = require("hardhat");

async function main() {
  console.log("Deploying AIAgentRegistry...");

  const AIAgentRegistry = await hre.ethers.getContractFactory("AIAgentRegistry");
  const registry = await AIAgentRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`AIAgentRegistry deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 