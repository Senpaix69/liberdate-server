import Redis from "ioredis";

const redis = new Redis({
  host: "redis-19193.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  password: "NTZenLoSKbSt62TeoWWiiXN0s4KCAkYE",
  maxRetriesPerRequest: null,
  port: 19193,
});

redis.on("connect", async () => {
  console.log("Connected to Redis server");
});

redis.on("error", (err) => {
  console.error(`Error connecting to Redis: ${err}`);
});

redis.on("ready", () => {
  console.log("Redis client is ready");
});

redis.on("end", () => {
  console.log("Redis client disconnected");
});

redis.on("reconnecting", () => {
  console.log("Reconnecting to Redis");
});

const gracefulShutdown = () => {
  console.log("Shutting down gracefully...");
  redis.quit((err, res) => {
    if (err) {
      console.error("Error shutting down Redis client:", err);
    } else {
      console.log("Redis client shut down:", res);
    }
    process.exit();
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);

export default redis;
