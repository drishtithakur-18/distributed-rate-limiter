local rate_limit_key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local current_time = tonumber(ARGV[3])
local record = redis.call("GET", rate_limit_key)
local tokens = 0
local last_refilled = 0

if not record or record == false then
    tokens = capacity
    last_refilled = current_time
else
    local data = cjson.decode(record)
    tokens = tonumber(data["tokens"])
    last_refilled = tonumber(data["lastRefilled"])
    
    local time_passed = (current_time - last_refilled) / 1000
    local generated_tokens = time_passed * refill_rate
    tokens = math.min(capacity, tokens + generated_tokens)
end
local is_accepted = 0
if tokens >= 1 then
    tokens = tokens - 1
    is_accepted = 1
end
last_refilled = current_time
local new_state = cjson.encode({tokens = tokens, lastRefilled = last_refilled})
redis.call("SET", rate_limit_key, new_state, "EX", 60)
return {is_accepted, tokens}