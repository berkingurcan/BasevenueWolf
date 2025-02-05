import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { encodeFunctionData } from "viem";

// Schema for mint action
const MintSchema = z.object({
  contractAddress: z.string().describe("The ERC20 token contract address"),
  recipient: z.string().describe("The address to receive the minted tokens"),
  amount: z.string().describe("The amount of tokens to mint"),
});

/**
 * TokenManagerActionProvider handles ERC20 token management operations like minting
 */
export class TokenManagerActionProvider extends ActionProvider {
  constructor() {
    super("token-manager", []);
  }

  /**
   * Mints ERC20 tokens to a specified address
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
    args: z.infer<typeof MintSchema>,
    walletProvider?: EvmWalletProvider,
  ): Promise<string> {
    if (!walletProvider) {
      throw new Error("Wallet provider is required for minting tokens");
    }

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
