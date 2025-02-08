import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { encodeFunctionData } from "viem";
import { createClient } from 'redis';
// Schema for mint action
const MintSchema = z
  .object({
    contractAddress: z.string().describe("The ERC20 token contract address"),
    recipient: z.string().describe("The address to receive the minted tokens"),
    amount: z.string().describe("The amount of tokens to mint"),
  })
  .strip()
  .describe("The parameters for the mint action");

// Schema for deploy token action
const DeployTokenSchema = z
  .object({
    name: z.string().describe("The name of the token"),
    symbol: z.string().describe("The token symbol"),
    amount: z.string().describe("The initial supply to be minted"),
    mintAddress: z
      .string()
      .describe("The address to receive the initial minted tokens"),
  })
  .strip()
  .describe("The parameters for the deploy token action");

/**
 * TokenManagerActionProvider handles ERC20 token management operations like minting and deployment
 */
export class TokenManagerActionProvider extends ActionProvider {
  constructor() {
    super("token-manager", []);
  }

  /**
   * Deploys a new ERC20 token contract
   * @param walletProvider - The wallet provider to deploy the token from
   * @param args - The parameters for the deploy token action
   * @returns A message containing the deployment details
   */
  @CreateAction({
    name: "deploy_token",
    description: `
    This tool will deploy a new ERC20 token contract.

    It takes the following inputs:
    - name: The name of the token
    - symbol: The token symbol
    - amount: The initial supply to be minted
    - mintAddress: The address that will receive the initial minted tokens
    `,
    schema: DeployTokenSchema,
  })
  async deployToken(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof DeployTokenSchema>,
  ): Promise<string> {
    try {
      // ERC20Deployer deployToken function ABI
      const deployTokenAbi = [
        {
          inputs: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "amount", type: "uint256" },
            { name: "mintAddress", type: "address" },
          ],
          name: "deployToken",
          outputs: [{ name: "tokenAddress", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const hash = await walletProvider.sendTransaction({
        to: `0x${(process.env.ERC20_DEPLOYER_ADDRESS || "").replace("0x", "")}`,
        data: encodeFunctionData({
          abi: deployTokenAbi,
          functionName: "deployToken",
          args: [
            args.name,
            args.symbol,
            BigInt(args.amount),
            `0x${args.mintAddress.replace("0x", "")}`,
          ],
        }),
      });

      const receipt = await walletProvider.waitForTransactionReceipt(hash);

      const tokenAddress = receipt.logs[0].address;
      
      const redisClient = await createClient({ url: process.env.REDIS_URL }).connect();
      await redisClient.set(args.mintAddress, tokenAddress);
      return `Successfully deployed token "${args.name}" (${args.symbol}) with initial supply of ${args.amount} to ${args.mintAddress}.\nTransaction hash: ${hash}\nToken address: ${tokenAddress}`;
    } catch (error) {
      return `Error deploying token: ${error}`;
    }
  }

  /**
   * Mints ERC20 tokens to a specified address
   * @param walletProvider - The wallet provider to mint the tokens from
   * @param args - The parameters for the mint action
   * @returns A message containing the mint details
   */
  @CreateAction({
    name: "mint_tokens",
    description: `
    This tool will mint ERC20 tokens to a specified address.

    It takes the following inputs:
    - contractAddress: The contract address of the ERC20 token
    - recipient: The address that will receive the minted tokens
    - amount: The amount of tokens to mint

    Note: This action will only work if the connected wallet has minting privileges on the contract.
    `,
    schema: MintSchema,
  })
  async mint(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof MintSchema>,
  ): Promise<string> {
    try {
      // ERC20 mint function ABI
      const mintAbi = [
        {
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          name: "mint",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const hash = await walletProvider.sendTransaction({
        to: `0x${args.contractAddress.replace("0x", "")}`,
        data: encodeFunctionData({
          abi: mintAbi,
          functionName: "mint",
          args: [`0x${args.recipient.replace("0x", "")}`, BigInt(args.amount)],
        }),
      });

      await walletProvider.waitForTransactionReceipt(hash);

      return `Successfully minted ${args.amount} tokens to ${args.recipient}.\nTransaction hash: ${hash}`;
    } catch (error) {
      return `Error minting tokens: ${error}`;
    }
  }

  /**
   * Checks if the provider supports the given network
   */
  supportsNetwork(_: Network): boolean {
    return true; // Support all networks by default
  }
}

export const tokenManagerActionProvider = () =>
  new TokenManagerActionProvider();
