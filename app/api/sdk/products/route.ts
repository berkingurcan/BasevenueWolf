import { NextResponse } from "next/server";
import { getProductFromRedis } from "@/lib/ai-agents/productManagerProvider";

export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const userWalletAddress = searchParams.get("userWalletAddress");
  
      if (!userWalletAddress) {
        return NextResponse.json(
          { error: "userWalletAddress is required" },
          { status: 400 }
        );
      }
  
      const products = await getProductFromRedis(userWalletAddress);
  
      return NextResponse.json({
        success: true,
        data: {
          userWalletAddress,
          products,
          count: products.length,
        },
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
  }