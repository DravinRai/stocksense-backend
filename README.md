# StockSense Backend Proxy

This is the secure proxy server for the StockSense Investment Companion app. It handles sensitive API requests to Yahoo Finance and AI providers (Groq/Anthropic) to keep API keys safe.

## 🚀 Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```bash
   PORT=3001
   GROQ_API_KEY=your_key
   ANTHROPIC_API_KEY=your_key
   ```

3. Start the server:
   ```bash
   npm start
   ```

## 🛡️ Features
- **Security**: Uses `helmet` and `cors`.
- **Rate Limiting**: Protects against API abuse.
- **AI Integration**: Proxies requests to Llama-3.3 on Groq.
