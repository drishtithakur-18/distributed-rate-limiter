# Distributed API Rate Limiter

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

An atomic, highly-concurrent API rate limiter built to protect infrastructure from burst traffic and spam. This microservice implements the "lazy evaluation" **Token Bucket algorithm** using server-side **Lua scripting** to guarantee 100% transaction atomicity and entirely eliminate multi-thread race conditions.

## Load Testing & Performance
Stress-tested using **Autocannon** to simulate massive burst traffic (100 concurrent connections over 10 seconds). The bucket capacity was set to 10 tokens with a 1 token/sec refill rate.
* **Average Throughput:** ~4,469 Requests/Second
* **Average Latency:** ~16.59ms
* **Reliability:** Handled 44,318 total requests in 10 seconds. Successfully limited successful requests to **exactly 19** (mathematically perfect: 10 initial + 9 refilled) while successfully blocking **44,299** excess requests with `429 Too Many Requests`—all with zero bucket leakage or race conditions.

  <img width="932" height="412" alt="Screenshot 2026-07-18 223840" src="https://github.com/user-attachments/assets/3ff2cc29-d000-47ba-a4e7-5018cd784233" />


## Core Architecture & Engineering Decisions
* **Atomic Execution:** Lua scripting inside Redis is utilized to calculate elapsed time, partial token generation, and bucket capacity in a single, indivisible operation. This guarantees zero race conditions during simultaneous request bursts.
* **Lazy Evaluation:** Instead of running heavy background cron jobs to refill tokens, the script calculates the exact tokens generated at the exact millisecond a request is made, significantly reducing CPU overhead.
* **Fail-Open Fault Tolerance:** The middleware is wrapped in defensive `try/catch` logic. If the Redis cluster crashes or times out, the system "fails open," allowing traffic through to ensure the core API remains highly available.
* **Spammer Protection:** Updates Redis state and refreshes the TTL (Time-To-Live) even on rejected requests. This prevents malicious botnets from draining the bucket, waiting for expiration, and getting a free reset.
* **Standard Header Injection:** Automatically injects `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers for seamless client backoff logic.

## Architecture Flow
`Client/Bot Request` ➔ `Express App` ➔ `Rate Limiter Middleware` ➔ `Redis (Atomic Lua Script)` ➔ `Controller Response`

## Local Setup & Installation

**Prerequisites:** Docker, Docker Compose, Node.js (v18+)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/drishtithakur-18/distributed-rate-limiter.git
 2. **Start everything (Redis + API server):**
   ```bash
   docker-compose up --build
 ```
3. **Test the endpoint:**
   ```bash
   curl http://localhost:3000/api/data
7. **Run the load test:**
   ```bash
   npx autocannon -c 100 -d 10 http://localhost:3000/api/data
    ```

   ## 📂 Project Structure

<img width="375" height="301" alt="image" src="https://github.com/user-attachments/assets/75bf61af-ee74-44c7-aff5-f03743aaaa87" />



