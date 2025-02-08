import { NextResponse } from 'next/server';
import { createClient } from 'redis';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userWalletAddress = searchParams.get('userWalletAddress');

    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'userWalletAddress is required' },
        { status: 400 }
      );
    }

    // Fetch user data from Redis
    const redisClient = await createClient({ url: process.env.REDIS_URL }).connect();
    const userData = await redisClient.get(userWalletAddress);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: userData });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
