const express = require('express');
const redis = require('redis');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = redis.createClient({ url: 'redis://redis-cache:6379' });
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis yaaayyy'));

const luaScript = fs.readFileSync('./limiter.lua', 'utf8');

const CAPACITY = 10;
const REFILL_RATE = 1;

const distributedRateLimiter = async (req, res, next) => {
    const userIP = req.ip || "local_test_ip";
    const currentTime = Date.now();

    console.log("-> Request arrived. Checking Redis...");

    try {
        const result = await redisClient.eval(luaScript, {
            keys: [userIP],
            arguments: [CAPACITY.toString(), REFILL_RATE.toString(), currentTime.toString()]
        });

        const isAccepted = result[0] === 1;
        const remainingTokens = result[1];

        res.setHeader('X-RateLimit-Limit', CAPACITY);
        res.setHeader('X-RateLimit-Remaining', remainingTokens);

        if (isAccepted) {
            console.log(`Accepted. Tokens left: ${remainingTokens}`);
            next();
        } else {
            console.log(`REJECTED. Tokens left: ${remainingTokens}`);
            const waitTimeSeconds = Math.ceil(1 / REFILL_RATE);
            res.setHeader('Retry-After', waitTimeSeconds);
            res.status(429).json({ 
                error: "Too Many Requests. Bucket is empty.",
                retryAfterSeconds: waitTimeSeconds
            });
        }
    } catch (err) {
        console.error("Redis Script Error: ", err);
        res.status(500).send("Internal Server Error");
    }
};

app.get('/api/data', distributedRateLimiter, (req, res) => {
    res.status(200).json({
        message: "Success:You fetched the secure data.",
        timestamp: new Date().toISOString()
    });
});

redisClient.connect().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
});