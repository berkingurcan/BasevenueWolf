import { z } from "zod";
import {
  ActionProvider,
  CreateAction,
  EvmWalletProvider,
  Network,
} from "@coinbase/agentkit";
import { encodeFunctionData } from "viem";
import { createClient } from "redis";

// Redis key prefixes for different product types
const REDIS_KEYS = {
  GAME_PRODUCT: "game_product:",
  GAME_ITEM: "game_item:",
  PRODUCT_LIST: "product_list",
  ITEM_LIST: "item_list",
  USER_PRODUCTS: "user_products:",
} as const;

// Helper function to store product data in Redis
async function storeProductInRedis(
  productType: "game_product" | "game_item",
  productData: {
    contractAddress: string;
    userWalletAddress: string;
  },
) {
  try {
    const redisClient = await createClient({
      url: process.env.REDIS_URL,
    }).connect();

    const key = `${
      productType === "game_product"
        ? REDIS_KEYS.GAME_PRODUCT
        : REDIS_KEYS.GAME_ITEM
    }${productData.contractAddress}`;

    // Store contract address
    await redisClient.set(key, productData.contractAddress);

    // Add to the list of products/items
    const listKey =
      productType === "game_product"
        ? REDIS_KEYS.PRODUCT_LIST
        : REDIS_KEYS.ITEM_LIST;
    await redisClient.sAdd(listKey, productData.contractAddress);

    // Add to user's products list
    const userKey = `${REDIS_KEYS.USER_PRODUCTS}${productData.userWalletAddress}`;
    await redisClient.sAdd(userKey, productData.contractAddress);

    await redisClient.quit();
    return true;
  } catch (error) {
    console.error("Redis storage error:", error);
    return false;
  }
}

// Helper function to get product data from Redis
export async function getProductFromRedis(
  userWalletAddress: string,
): Promise<string[]> {
  try {
    const redisClient = await createClient({
      url: process.env.REDIS_URL,
    }).connect();

    const userKey = `${REDIS_KEYS.USER_PRODUCTS}${userWalletAddress}`;
    const products = await redisClient.sMembers(userKey);

    await redisClient.quit();
    return products;
  } catch (error) {
    console.error("Redis retrieval error:", error);
    return [];
  }
}

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
    tokenURI: z.string().optional().describe("The URI for the token metadata"),
  })
  .strip()
  .describe("The parameters for creating a game item NFT (ERC721)");

// Schema for deploying game product
const DeployGameProductSchema = z
  .object({
    name: z.string().describe("The name of the game product token"),
    symbol: z.string().describe("The game product token symbol"),
    amount: z.string().describe("The initial supply to be minted"),
    mintAddress: z
      .string()
      .describe("The address to receive the initial minted tokens"),
  })
  .strip()
  .describe("The parameters for deploying a new game product token");

// Schema for deploying game item (NFT)
const DeployGameItemSchema = z
  .object({
    name: z.string().describe("The name of the game item collection"),
    symbol: z.string().describe("The game item collection symbol"),
    baseURI: z.string().describe("The base URI for token metadata"),
    mintAddress: z.string().describe("The address that can mint NFTs"),
  })
  .strip()
  .describe("The parameters for deploying a new game item collection");

/**
 * ProductManagerProvider handles game product operations using ERC20 and ERC721 tokens
 */
export class ProductManagerProvider extends ActionProvider {
  constructor() {
    super("product-manager", []);
  }

  /**
   * Deploys a new game product token contract
   */
  @CreateAction({
    name: "deploy_game_product",
    description: `
    This tool will deploy a new game product token contract (ERC20).
    
    Suitable for:
    - In-game currencies (coins, gems)
    - Energy points
    - Experience points
    - Any fungible game resource
    
    Required inputs:
    - name: The name of the token (e.g., "Game Coins", "Energy Crystals")
    - symbol: The token symbol (e.g., "GCOIN", "ENRG")
    - amount: The initial supply to be minted
    - mintAddress: The address that will receive the initial minted tokens
    `,
    schema: DeployGameProductSchema,
  })
  async deployGameProduct(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof DeployGameProductSchema>,
  ): Promise<string> {
    try {
      // GameProductDeployer deployGameProduct function ABI
      const deployProductAbi = [
        {
          inputs: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "amount", type: "uint256" },
            { name: "mintAddress", type: "address" },
          ],
          name: "deployGameProduct",
          outputs: [{ name: "tokenAddress", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const hash = await walletProvider.sendTransaction({
        to: `0x${(process.env.GAME_PRODUCT_DEPLOYER_ADDRESS || "").replace("0x", "")}`,
        data: encodeFunctionData({
          abi: deployProductAbi,
          functionName: "deployGameProduct",
          args: [
            args.name,
            args.symbol,
            BigInt(args.amount),
            `0x${args.mintAddress.replace("0x", "")}`,
          ],
        }),
      });

      const receipt = await walletProvider.waitForTransactionReceipt(hash);
      const contractAddress = receipt.logs[0].address;
      const userWalletAddress = args.mintAddress;

      // Store product data in Redis
      const stored = await storeProductInRedis("game_product", {
        contractAddress,
        userWalletAddress,
      });

      const redisStatus = stored
        ? "Product data stored in Redis."
        : "Warning: Failed to store product data in Redis.";
      return `Successfully deployed game product "${args.name}" (${args.symbol}) with initial supply of ${args.amount} to ${args.mintAddress}.\nTransaction hash: ${hash}\nContract address: ${contractAddress}\n`;
    } catch (error) {
      return `Error deploying game product: ${error}`;
    }
  }

  /**
   * Deploys a new game item collection contract (NFT)
   */
  @CreateAction({
    name: "deploy_game_item_collection",
    description: `
    This tool will deploy a new game item collection contract (ERC721).
    
    Suitable for:
    - Unique characters
    - Weapons and equipment
    - Special items
    - Collectibles
    - Any non-fungible game asset
    
    Required inputs:
    - name: The name of the collection (e.g., "Legendary Weapons", "Hero Characters")
    - symbol: The collection symbol (e.g., "WEAPON", "HERO")
    - baseURI: The base URI for token metadata
    `,
    schema: DeployGameItemSchema,
  })
  async deployGameItemCollection(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof DeployGameItemSchema>,
  ): Promise<string> {
    try {
      // GameItemDeployer deployGameItem function ABI (hypothetical)
      const deployItemAbi = [
        {
          inputs: [
            { name: "name", type: "string" },
            { name: "symbol", type: "string" },
            { name: "baseURI", type: "string" },
          ],
          name: "deployGameItem",
          outputs: [{ name: "tokenAddress", type: "address" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const hash = await walletProvider.sendTransaction({
        to: `0x${(process.env.GAME_ITEM_DEPLOYER_ADDRESS || "").replace("0x", "")}`,
        data: encodeFunctionData({
          abi: deployItemAbi,
          functionName: "deployGameItem",
          args: [args.name, args.symbol, args.baseURI],
        }),
      });

      const receipt = await walletProvider.waitForTransactionReceipt(hash);
      const contractAddress = receipt.logs[0].address;
      const userWalletAddress = args.mintAddress;

      // Store item collection data in Redis
      const stored = await storeProductInRedis("game_item", {
        contractAddress,
        userWalletAddress,
      });

      return `Successfully deployed game item collection "${args.name}" (${args.symbol}) with minting privileges to ${args.mintAddress}.\nTransaction hash: ${hash}\nContract address: ${contractAddress}\n`;
    } catch (error) {
      return `Error deploying game item collection: ${error}`;
    }
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
            { name: "tokenURI", type: "string" },
          ],
          name: "mint",
          outputs: [{ name: "tokenId", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const;

      const hash = await walletProvider.sendTransaction({
        to: `0x${args.contractAddress.replace("0x", "")}`,
        data: encodeFunctionData({
          abi: mintNftAbi,
          functionName: "mint",
          args: [`0x${args.recipient.replace("0x", "")}`, args.tokenURI || ""],
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
