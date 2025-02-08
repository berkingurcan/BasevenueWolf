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

### Health Check API

**Endpoint**: `GET /api/health`

Check the health status of the application.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-02-07T12:00:00Z"
}
```

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
  ],
  "userWalletAddress": "0x5e7EC86C282BFF4583C80E5b275fc10246d19dBD"
}
```

or with memory:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "My name is eylül"
    },
    {
      "role": "assistant",
      "content": "Hello eylül! How can I assist you today?"
    },
    {
      "role": "user",
      "content": "What is my name? and which tools do you have"
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
