import { formatEther, parseEther, Log } from "viem";
import hre from "hardhat";

async function main() {
  // Get network information
  const client = await hre.viem.getPublicClient();
  const chainId = await client.getChainId();
  console.log(`Deploying to network with Chain ID: ${chainId}`);

  console.log("Deploying contracts...");

  // Deploy ERC20Deployer
  const erc20Deployer = await hre.viem.deployContract("ERC20Deployer");
  console.log(`ERC20Deployer deployed to: ${erc20Deployer.address}`);
  console.log("Waiting for deployment transaction to be confirmed...");

  // Deploy a sample token using the deployer
  const [deployer] = await hre.viem.getWalletClients();
  const tokenName = "Sample Token";
  const tokenSymbol = "SMPL";
  const initialSupply = parseEther("1000000"); // 1 million tokens

  console.log(`\nDeploying sample token...`);
  console.log(`Name: ${tokenName}`);
  console.log(`Symbol: ${tokenSymbol}`);
  console.log(`Initial Supply: ${formatEther(initialSupply)} tokens`);

  const tx = await erc20Deployer.write.deployToken([
    tokenName,
    tokenSymbol,
    initialSupply,
    deployer.account.address,
  ]);

  console.log("Waiting for token deployment transaction to be confirmed...");

  // Get the token address from the event logs
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  const event = receipt.logs.find(
    (log: Log) =>
      log.address.toLowerCase() === erc20Deployer.address.toLowerCase(),
  );

  if (event && event.topics[1]) {
    const tokenAddress = `0x${event.topics[1].slice(26)}`;
    console.log(`\nDeployment successful!`);
    console.log(`Sample token deployed to: ${tokenAddress}`);
    console.log(`Initial supply: ${formatEther(initialSupply)} ${tokenSymbol}`);

    // Print summary
    console.log(`\nDeployment Summary:`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`ERC20Deployer: ${erc20Deployer.address}`);
    console.log(`Sample Token: ${tokenAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
