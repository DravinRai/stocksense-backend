const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.ip} - ${req.method} ${req.originalUrl}`);
    next();
});

// CORS Configuration
const allowedOrigins = [
    'http://localhost:8081', // Expo web / proxy
    'http://localhost:19000', // Expo Go
    'http://localhost:19006', // Expo web
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

// Rate Limiting: 10 requests per minute per IP
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { error: 'Too many requests, please try again after a minute.' }
});
app.use('/api/', limiter);

// Routes
// POST /api/analyze — calls Anthropic/Groq API
app.post('/api/analyze', async (req, res) => {
    try {
        const { stockData, userHolding, totalPortfolioValue } = req.body;
        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        // Using Groq for consistency with existing service
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            temperature: 0.15,
            max_tokens: 3000,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: req.body.systemPrompt
                },
                {
                    role: "user",
                    content: req.body.userPrompt
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Analyze Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to analyze stock data' });
    }
});

// GET /api/stock/:symbol — fetches from Yahoo Finance
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Stock Data Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

// GET /api/chart/:symbol — fetches chart data
app.get('/api/chart/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1d', range = '1y' } = req.query;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Chart Data Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// GET /api/search — searches for stocks
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Search Error:', error.message);
        res.status(500).json({ error: 'Failed to search stocks' });
    }
});

// GET /api/quote-summary/:symbol
app.get('/api/quote-summary/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${symbol}?modules=assetProfile,summaryDetail,defaultKeyStatistics,financialData`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Quote Summary Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch quote summary' });
    }
});

// GET /api/nifty — fetches Nifty 50 level
app.get('/api/nifty', async (req, res) => {
    try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/quote?symbols=^NSEI';
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Nifty Data Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch Nifty data' });
    }
});

// GET /api/market/quotes — fetches multiple symbols
app.get('/api/market/quotes', async (req, res) => {
    try {
        const { symbols } = req.query;
        if (!symbols) return res.status(400).json({ error: 'Missing symbols' });
        const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbols}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Market Quotes Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch market quotes' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
