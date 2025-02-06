import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { bridgeUSDC } from "./bridgeUtils";
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

// Schema for bridge action
const BridgeSchema = z
  .object({
    baseWalletId: z.string().describe("The wallet ID on Base network"),
    arbitrumWalletId: z.string().describe("The wallet ID on Arbitrum network"),
    amount: z.string().describe("The amount of USDC to bridge"),
  })
  .strip()
  .describe("The parameters for the bridge action");

/**
 * BridgeActionProvider handles cross-chain bridging operations
 */
export class BridgeActionProvider extends ActionProvider {
  constructor() {
    super("bridge-provider", []);
  }

  /**
   * Bridges USDC from Base to Arbitrum
   * @param _walletProvider - The wallet provider
   * @param args - The arguments for the bridge action
   * @returns A string indicating the success or failure of the bridge operation
   */
  @CreateAction({
    name: "bridge_usdc",
    description: `
    This tool will bridge USDC tokens from Base to Arbitrum using Circle's CCTP.
    
    Required inputs:
    - baseWalletId: The wallet ID for Base network
    - arbitrumWalletId: The wallet ID for Arbitrum network
    - amount: Amount of USDC to bridge
    
    Note: This action requires properly configured wallets on both networks.
    `,
    schema: BridgeSchema,
  })
  async bridgeUSDC(
    _walletProvider: EvmWalletProvider,
    args: z.infer<typeof BridgeSchema>,
  ): Promise<string> {
    try {
      // Configure Coinbase SDK file path in the root directory
      Coinbase.configureFromJson({
        filePath: `../cdp_api_key.json`,
      });

      const baseWallet = await this.loadWallet(args.baseWalletId);
      const arbitrumWallet = await this.loadWallet(args.arbitrumWalletId);

      if (!baseWallet || !arbitrumWallet) {
        throw new Error("Failed to load wallets");
      }

      await bridgeUSDC(baseWallet, arbitrumWallet, BigInt(args.amount));

      return `Successfully initiated USDC bridge of ${args.amount} from Base to Arbitrum`;
    } catch (error) {
      return `Error bridging USDC: ${error}`;
    }
  }

  /**
   * Helper function to load a wallet
   * @param walletId - The ID of the wallet to load
   * @returns The loaded wallet or null if an error occurs
   */
  private async loadWallet(walletId: string): Promise<Wallet | null> {
    try {
      const wallet = await Wallet.fetch(walletId);
      return wallet;
    } catch (error) {
      console.error(`Error loading wallet ${walletId}: `, error);
      return null;
    }
  }

  /**
   * Checks if the provider supports the given network
   */
  supportsNetwork(network: Network): boolean {
    // Only support Base and Arbitrum networks
    return (
      String(network).includes("base") || String(network).includes("arbitrum")
    );
  }
}

export const bridgeActionProvider = () => new BridgeActionProvider();
