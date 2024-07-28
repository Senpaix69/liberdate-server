import {
  initMessageEvents,
  initRoomEvents,
} from "./methods/producer_methods.js";
import {
  deleteFromRedis,
  getFromRedis,
  setToRedis,
} from "../redis/redis_methods.js";
import Restriction from "../models/restriction_model.js";
import redis from "../redis/redis_client.js";
import initWorkers from "./worker.js";
import { Queue } from "bullmq";

const roomQueue = new Queue("room-deletion", { connection: redis });
initRoomEvents("room-deletion", redis);

const addRoom = async (roomId, userAId, userBId) => {
  try {
    const redisR = await getFromRedis("restriction:adminRestrictions");
    const { matchExpireTime } = redisR || (await Restriction.findOne().lean());
    const key1 = `deleteRoom:${userAId}:${roomId}`;
    const key2 = `deleteRoom:${userBId}:${roomId}`;

    const job = await roomQueue.add(
      "deleteRoom",
      { roomId },
      { delay: matchExpireTime * 1000 }
    );

    await Promise.all([
      setToRedis(
        key1,
        {
          expire: matchExpireTime,
          userId: userAId,
          jobId: job.id,
          key: key1,
          roomId,
        },
        matchExpireTime / 60
      ),
      setToRedis(
        key2,
        {
          expire: matchExpireTime,
          userId: userBId,
          jobId: job.id,
          key: key2,
          roomId,
        },
        matchExpireTime / 60
      ),
    ]);

    console.log(`Room ${roomId} will be deleted in ${matchExpireTime} secs.`);
  } catch (error) {
    console.error(`Failed to add room ${roomId} to queue: ${error.message}`);
  }
};

const removeRoom = async (userAId, userBId, roomId) => {
  try {
    const key1 = `deleteRoom:${userBId}:${roomId}`;
    const key2 = `deleteRoom:${userAId}:${roomId}`;
    const redisCache = await getFromRedis(key1);

    if (redisCache?.jobId) {
      const job = await roomQueue.getJob(redisCache.jobId);
      if (job) {
        await job.remove();
        console.log(`Room ${roomId} deletion has been cancelled.`);
      } else {
        console.log(`Job for room ${roomId} not found.`);
      }
      await Promise.all([deleteFromRedis(key1), deleteFromRedis(key2)]);
    } else {
      console.log(`No job ID found for room ${roomId}.`);
    }
  } catch (error) {
    console.error(
      `Failed to remove room ${roomId} from queue: ${error.message}`
    );
  }
};

const messageQueue = new Queue("notification", { connection: redis });
initMessageEvents("notification", redis);

async function addNotification(message) {
  await messageQueue.add("notification", message, { delay: 1000 });
  console.log("Notification added");
}

initWorkers(redis);
export { addRoom, addNotification, removeRoom };
