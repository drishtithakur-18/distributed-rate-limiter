# Production-Grade Distributed API Rate Limiter

An atomic, highly-concurrent API rate limiter built with **Node.js**, **Express**, and **Redis**. This microservice implements the "lazy evaluation" **Token Bucket algorithm** using server-side **Lua scripting** to guarantee 100% transaction atomicity and entirely eliminate multi-thread race conditions under heavy load.

## 🚀 Tech Stack
* **Backend:** Node.js, Express.js
* **Database / Cache:** Redis
* **Scripting:** Lua (Server-side atomic operations)
* **Infrastructure:** Docker, Docker Compose
* **Testing:** Autocannon (Load & Stress Testing)

## 🧠 System Architecture
In a standard Node.js environment, querying a cache (`GET`) and updating it (`SET`) natively creates race conditions during burst traffic. This architecture solves that by offloading the mathematical calculation of the Token Bucket directly to the Redis engine.

1. **Request Interception:** Express middleware intercepts incoming HTTP requests.
2. **Atomic Execution:** A Lua script is sent to Redis, containing the user's IP, maximum capacity, refill rate, and the current timestamp.
3. **Evaluation:** Redis natively calculates elapsed time, fractional token generation, and capacity limits in a single, indivisible operation.
4. **Header Injection:** The API returns standard rate-limiting headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`) to allow frontend clients to implement backoff logic.

## 📊 Performance & Load Testing
The system was stress-tested using **Autocannon** to simulate massive burst traffic and verify the absence of bucket leakage.

**Test Conditions:** * 100 concurrent connections 
* 10-second sustained burst
* Bucket Capacity: 10 tokens | Refill Rate: 1 token/sec

**Results:**
* **Total Requests Handled:** 45,000+ in 10 seconds.
* **Successful (2xx):** ~19-21 requests (Mathematically perfect: 10 initial tokens + 9-10 refilled over the test duration).
* **Rejected (4xx):** 44,980+ requests successfully blocked with `429 Too Many Requests`.
* **Race Conditions / Leaks:** 0


