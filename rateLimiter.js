class SlidingWindowStore {
    constructor() {
        this.windows = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    isAllowed(key, limit, windowMs) {
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!this.windows.has(key)) {
            this.windows.set(key, []);
        }

        const requests = this.windows.get(key);

        const validRequests = requests.filter(timestamp => timestamp > windowStart);

        if (validRequests.length < limit) {
            validRequests.push(now);
            return true;
        }

        return false;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, requests] of this.windows.entries()) {
            const recentRequests = requests.filter(timestamp => now - timestamp < 600000)

            if (recentRequests.length === 0) {
                this.windows.delete(key);
            } else {
                this.windows.set(key, recentRequests);
            }
        }
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.windows.clear();
    }
}

function createSlidingWindowLimiter(options = {}) {
    const {
        windowMs = 60000,
        max = 100,
        keyGenerator = (req) => req.ip,
        message = 'Too many requests, please try again later.',
        statusCode = 429
    } = options;

    const store = new SlidingWindowStore();

    return (req, res, next) => {
        const key = keyGenerator(req);

        if (store.isAllowed(key, max, windowMs)) {
            const requests = store.windows.get(key) || [];
            res.set({
                'X-RateLimit-Limit': max,
                'X-RateLimit-Remaining': Math.max(0, max - requests.length),
                'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
            });
            next();
        } else {
            res.status(statusCode).json({
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    }
}

exports.createRateLimiter = createSlidingWindowLimiter