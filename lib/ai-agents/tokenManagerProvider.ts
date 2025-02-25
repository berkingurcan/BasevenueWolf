import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { encodeFunctionData } from "viem";
import { createClient } from "redis";

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

      const redisClient = await createClient({
        url: process.env.REDIS_URL,
      }).connect();
      await redisClient.set(args.mintAddress, tokenAddress);

      return `Successfully deployed token "${args.name}" (${args.symbol}) with initial supply of ${args.amount} to ${args.mintAddress}.\nTransaction hash: ${hash}\nToken address: ${tokenAddress}`;
    } catch (error) {
      return `Error deploying token: ${error}`;
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
