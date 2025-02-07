import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { encodeFunctionData } from "viem";

// Schema for token deployment
const DeployTokenSchema = z
  .object({
    factoryAddress: z
      .string()
      .describe("The GameTokenFactory contract address"),
    name: z.string().describe("The name of the token"),
    symbol: z.string().describe("The symbol of the token"),
    tokenURI: z.string().describe("The metadata URI for the token"),
  })
  .strip()
  .describe("The parameters for deploying a new game token");

/**
 * TokenDeployerProvider handles deployment of new ERC20 game tokens
 */
export class TokenDeployerProvider extends ActionProvider {
  constructor() {
    super("token-deployer", []);
  }

  @CreateAction({
    name: "deploy_game_token",
    description: `
    This tool will deploy a new ERC20 game token using the GameTokenFactory.
    
    Required inputs:
    - factoryAddress: The address of the GameTokenFactory contract
    - name: The name of the token (e.g., "Game Coins")
    - symbol: The token symbol (e.g., "GCOIN")
    - tokenURI: The URI pointing to the token's metadata
    `,
    schema: DeployTokenSchema,
  })
  async deployToken(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof DeployTokenSchema>,
  ): Promise<string> {
    try {
      // Factory createToken function ABI
      const createTokenAbi = [
        {
          inputs: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "tokenURI", type: "string" },
          ],
          name: "createToken",
          outputs: [{ name: "", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const hash = await walletProvider.sendTransaction({
        to: `0x${args.factoryAddress.replace("0x", "")}`,
        data: encodeFunctionData({
          abi: createTokenAbi,
          functionName: "createToken",
          args: [args.name, args.symbol, args.tokenURI],
        }),
      });

      const receipt = await walletProvider.waitForTransactionReceipt(hash);

      return `Successfully deployed new token ${args.name} (${args.symbol}).\nTransaction hash: ${hash}`;
    } catch (error) {
      return `Error deploying token: ${error}`;
    }
  }

  supportsNetwork(_: Network): boolean {
    return true;
  }
}

export const tokenDeployerProvider = () => new TokenDeployerProvider();
