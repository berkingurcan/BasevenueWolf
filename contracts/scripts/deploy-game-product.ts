import { formatEther, parseEther, Log } from "viem";
import hre from "hardhat";

async function main() {
  // Get network information
  const client = await hre.viem.getPublicClient();
  const chainId = await client.getChainId();
  console.log(`Deploying to network with Chain ID: ${chainId}`);

  console.log("Deploying contracts...");

  // Deploy GameProductDeployer
  const gameProductDeployer = await hre.viem.deployContract(
    "GameProductDeployer",
  );
  console.log(
    `GameProductDeployer deployed to: ${gameProductDeployer.address}`,
  );
  console.log("Waiting for deployment transaction to be confirmed...");

  // Deploy a sample game product token using the deployer
  const [deployer] = await hre.viem.getWalletClients();
  const tokenName = "Game Gold";
  const tokenSymbol = "GOLD";
  const initialSupply = parseEther("1000000"); // 1 million tokens

  console.log(`\nDeploying sample game product token...`);
  console.log(`Name: ${tokenName}`);
  console.log(`Symbol: ${tokenSymbol}`);
  console.log(`Initial Supply: ${formatEther(initialSupply)} tokens`);

  const tokenTx = await gameProductDeployer.write.deployGameProduct([
    tokenName,
    tokenSymbol,
    initialSupply,
    deployer.account.address,
  ]);

  console.log("Waiting for token deployment transaction to be confirmed...");

  // Get the token address from the event logs
  const tokenReceipt = await client.waitForTransactionReceipt({
    hash: tokenTx,
  });
  const tokenEvent = tokenReceipt.logs.find(
    (log: Log) =>
      log.address.toLowerCase() === gameProductDeployer.address.toLowerCase(),
  );

  let tokenAddress;
  if (tokenEvent && tokenEvent.topics[1]) {
    tokenAddress = `0x${tokenEvent.topics[1].slice(26)}`;
    console.log(`\nGame Product deployment successful!`);
    console.log(`Game Gold token deployed to: ${tokenAddress}`);
    console.log(`Initial supply: ${formatEther(initialSupply)} ${tokenSymbol}`);
  }

  // Print summary
  console.log(`\nDeployment Summary:`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`GameProductDeployer: ${gameProductDeployer.address}`);
  console.log(`Game Gold Token: ${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
