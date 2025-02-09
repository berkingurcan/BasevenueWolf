import { Log } from "viem";
import hre from "hardhat";

async function main() {
  // Get network information
  const client = await hre.viem.getPublicClient();
  const chainId = await client.getChainId();
  console.log(`Deploying to network with Chain ID: ${chainId}`);

  console.log("Deploying contracts...");

  // Deploy GameItemDeployer
  const gameItemDeployer = await hre.viem.deployContract("GameItemDeployer");
  console.log(`GameItemDeployer deployed to: ${gameItemDeployer.address}`);
  console.log("Waiting for deployment transaction to be confirmed...");

  // Deploy a sample game item collection using the deployer
  const [deployer] = await hre.viem.getWalletClients();
  const name = "Wolf Pack NFT";
  const symbol = "WOLF";
  const baseURI = "https://api.yourgame.com/nft/";

  console.log(`\nDeploying sample game item collection...`);
  console.log(`Name: ${name}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Base URI: ${baseURI}`);

  const nftTx = await gameItemDeployer.write.deployGameItem([
    name,
    symbol,
    baseURI,
  ]);

  console.log(
    "Waiting for NFT collection deployment transaction to be confirmed...",
  );

  // Get the NFT collection address from the event logs
  const nftReceipt = await client.waitForTransactionReceipt({
    hash: nftTx,
  });
  const nftEvent = nftReceipt.logs.find(
    (log: Log) =>
      log.address.toLowerCase() === gameItemDeployer.address.toLowerCase(),
  );

  let nftAddress;
  if (nftEvent && nftEvent.topics[1]) {
    nftAddress = `0x${nftEvent.topics[1].slice(26)}`;
    console.log(`\nGame Item deployment successful!`);
    console.log(`Wolf Pack NFT collection deployed to: ${nftAddress}`);
    console.log(`Base URI: ${baseURI}`);
  }

  // Print summary
  console.log(`\nDeployment Summary:`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`GameItemDeployer: ${gameItemDeployer.address}`);
  console.log(`Wolf Pack NFT Collection: ${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
