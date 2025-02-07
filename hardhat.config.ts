import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: `../env.local`, override: true });

// Ensure required environment variables are set
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const CUSTOM_NETWORK_URL = process.env.CUSTOM_NETWORK_URL || "";
const CUSTOM_NETWORK_CHAIN_ID = process.env.CUSTOM_NETWORK_CHAIN_ID ? parseInt(process.env.CUSTOM_NETWORK_CHAIN_ID) : 1234;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
    },
    custom: {
      url: CUSTOM_NETWORK_URL,
      chainId: CUSTOM_NETWORK_CHAIN_ID,
      accounts: [PRIVATE_KEY],
    },
    // For testing on public testnets
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
    // Add more networks as needed
  },
};

export default config; 