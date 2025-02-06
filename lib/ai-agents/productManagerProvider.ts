import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { encodeFunctionData } from "viem";

// Schema for ERC20 game product creation
const GameProductSchema = z
  .object({
    name: z.string().describe("Name of the game product"),
    symbol: z.string().describe("Symbol for the product token"),
    description: z.string().describe("Description of the game product"),
    contractAddress: z.string().describe("The ERC20 token contract address"),
    recipient: z.string().describe("The address to receive the minted tokens"),
    amount: z.string().describe("The amount of tokens to mint"),
  })
  .strip()
  .describe("The parameters for creating a game product token (ERC20)");

// Schema for ERC721 game item creation
const GameItemSchema = z
  .object({
    name: z.string().describe("Name of the game item"),
    symbol: z.string().describe("Symbol for the NFT"),
    description: z.string().describe("Description of the game item"),
    contractAddress: z.string().describe("The ERC721 token contract address"),
    recipient: z.string().describe("The address to receive the minted NFT"),
    tokenId: z.string().describe("The token ID for the NFT"),
  })
  .strip()
  .describe("The parameters for creating a game item NFT (ERC721)");

/**
 * ProductManagerProvider handles game product operations using ERC20 and ERC721 tokens
 */
export class ProductManagerProvider extends ActionProvider {
  constructor() {
    super("product-manager", []);
  }

  /**
   * Creates and mints game product using ERC20 tokens
   */
  @CreateAction({
    name: "create_game_product",
    description: `
    This tool will create and mint game product using ERC20 tokens.
    
    Suitable for:
    - In-game currencies (coins, gems)
    - Energy points
    - Experience points
    - Any fungible game resource
    
    Required inputs:
    - name: product name (e.g., "Game Coins", "Energy Crystals")
    - symbol: Token symbol (e.g., "GCOIN", "ENRG")
    - description: product description
    - contractAddress: The deployed ERC20 contract address
    - recipient: Address to receive the minted product
    - amount: Amount of product tokens to mint
    `,
    schema: GameProductSchema,
  })
  async createGameproduct(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GameProductSchema>,
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

      return `Successfully created and minted ${args.amount} ${args.name} (${args.symbol}) tokens to ${args.recipient}.\nTransaction hash: ${hash}`;
    } catch (error) {
      return `Error creating game product: ${error}`;
    }
  }

  /**
   * Creates and mints game items using ERC721 NFTs
   */
  @CreateAction({
    name: "create_game_item",
    description: `
    This tool will create and mint game items using ERC721 NFTs.
    
    Suitable for:
    - Unique characters
    - Weapons and equipment
    - Special items
    - Collectibles
    - Any non-fungible game asset
    
    Required inputs:
    - name: Item name (e.g., "Legendary Sword", "Hero Character")
    - symbol: NFT symbol (e.g., "GSWORD", "HERO")
    - description: Item description
    - contractAddress: The deployed ERC721 contract address
    - recipient: Address to receive the minted NFT
    - tokenId: Unique identifier for the NFT
    `,
    schema: GameItemSchema,
  })
  async createGameItem(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GameItemSchema>,
  ): Promise<string> {
    try {
      // ERC721 mint function ABI
      const mintNftAbi = [
        {
          inputs: [
            { name: "to", type: "address" },
            { name: "tokenId", type: "uint256" },
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
          abi: mintNftAbi,
          functionName: "mint",
          args: [`0x${args.recipient.replace("0x", "")}`, BigInt(args.tokenId)],
        }),
      });

      await walletProvider.waitForTransactionReceipt(hash);

      return `Successfully created and minted NFT ${args.name} (${args.symbol}) with ID ${args.tokenId} to ${args.recipient}.\nTransaction hash: ${hash}`;
    } catch (error) {
      return `Error creating game item: ${error}`;
    }
  }

  /**
   * Checks if the provider supports the given network
   */
  supportsNetwork(_: Network): boolean {
    return true; // Support all networks by default
  }
}

export const productManagerProvider = () => new ProductManagerProvider();
