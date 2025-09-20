# Rate Limiting Middleware

A Node.js Express middleware for implementing rate limiting using a sliding window algorithm.

## Features

- **Sliding Window Rate Limiting**: Uses a sliding window approach for more accurate rate limiting compared to fixed windows
- **Flexible Configuration**: Customize window size, request limits, key generation, and error messages
- **Multiple Rate Limiters**: Apply different rate limiting rules to different routes or user types
- **Automatic Cleanup**: Built-in cleanup mechanism to prevent memory leaks
- **Express Integration**: Seamlessly integrates with Express.js applications

## Installation

1. Clone the repository:

```bash
git clone https://github.com/adasarpan404/rate-limiting-middleware.git
cd rate-limiting-middleware
```

2. Install dependencies:

```bash
npm install
```

## Usage

### Basic Setup

```javascript
const express = require("express");
const { createRateLimiter } = require("./rateLimiter");

const app = express();

// Basic rate limiting - 100 requests per minute per IP
app.use(
  createRateLimiter({
    windowMs: 60000, // 1 minute
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Advanced Configuration

```javascript
// API-specific rate limiting
app.use(
  "/api/",
  createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    keyGenerator: (req) => `${req.ip}:${req.path}`, // Rate limit per IP and path
  })
);

// User-specific rate limiting (requires authentication)
app.use(
  "/api/user/",
  createRateLimiter({
    windowMs: 60000,
    max: 50,
    keyGenerator: (req) => req.user?.id || req.ip,
    skipSuccessfulRequests: true, // Don't count successful requests
  })
);
```

## Configuration Options

| Option                   | Default                                        | Description                                        |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------- |
| `windowMs`               | `60000`                                        | Time window in milliseconds                        |
| `max`                    | `100`                                          | Maximum number of requests allowed in the window   |
| `keyGenerator`           | `(req) => req.ip`                              | Function to generate the rate limiting key         |
| `message`                | `'Too many requests, please try again later.'` | Error message when rate limit is exceeded          |
| `statusCode`             | `429`                                          | HTTP status code for rate limit exceeded responses |
| `skipSuccessfulRequests` | `false`                                        | Whether to skip counting successful requests       |

## API Response Headers

When a request is allowed, the following headers are added:

- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets (ISO 8601 format)

## Rate Limit Exceeded Response

When the rate limit is exceeded, the server responds with:

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 60
}
```

## Testing

Start the server:

```bash
node server.js
```

Test with curl:

```bash
# Single request
curl http://localhost:3000/

# Test rate limiting (send 105 requests)
for i in {1..105}; do curl -s http://localhost:3000/; echo ""; done
```

After 100 requests within 1 minute, you should see the rate limit message.

## How It Works

The middleware uses a sliding window algorithm:

1. **Request Tracking**: Each request is timestamped and stored in memory
2. **Window Calculation**: Only requests within the current time window are counted
3. **Limit Checking**: If the number of requests exceeds the limit, the request is blocked
4. **Cleanup**: Old request timestamps are periodically cleaned up to prevent memory leaks

## License

This project is licensed under the MIT License.
