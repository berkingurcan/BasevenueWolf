# BASEVENUEWOLF

`ETH Global Agentic 2025`

🚀 BasevenueWolf is the blockchain and AI-powered alternative to RevenueCat, bringing seamless, transparent, and trustless product management and revenue analytics to Web3 Applications.

## Features

- 🤖 AI-powered Game Currency and Game products management
- 💰 Revenue analytics and tracking(TODO)
- ⛓️ Cross-chain bridging support(TODO)
- 📊 Real-time analytics dashboard(TODO)

## Installation

```bash
npm install
```

## How to run

```bash
npm run dev
```

### Prettier

```bash
npm run format
```

## API Documentation

### Chat

**Endpoint:**
`POST /api/chat`

**Request:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Which tools do you have"
    }
  ]
}
```

**Response:**
As [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream), the response will be streamed to the client.

```json
{
  "content": "I have the following tools: ..."
}
```
