const express = require('express');

const { createRateLimiter } = require('./rateLimiter');
const app = express();

// Basic rate limiting - 100 requests per minute per IP
app.use(createRateLimiter({
    windowMs: 60000, // 1 minute
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
}));

// API-specific rate limiting
app.use(createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 1000 requests per windowMs
    keyGenerator: (req) => `${req.ip}:${req.path}` // Rate limit per IP and path
}));

// User-specific rate limiting (requires authentication)
app.use('/api/user/', createRateLimiter({
    windowMs: 60000,
    max: 50,
    keyGenerator: (req) => req.user?.id || req.ip,
    skipSuccessfulRequests: true // Don't count successful requests
}));

app.get('/', (req, res) => {
    console.log(req.ip);
    res.json({ message: 'Hello World!' });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});