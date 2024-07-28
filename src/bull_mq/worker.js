import { createNotification } from "../clients/one_signal_client.js";
import Room from "../models/room_model.js";
import { Worker } from "bullmq";

const handleCompleted = (job) => {
  console.log(`Job ${job.id} has been completed`);
};

const handleFailed = (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
};

async function deleteRoom(job) {
  const { roomId } = job.data;
  try {
    const room = await Room.findOneAndDelete({ roomId });
    if (room) {
      console.log(`Room ${roomId} has been deleted.`);
    } else {
      console.log(`Room ${roomId} not found.`);
    }
  } catch (error) {
    console.error(
      `Error processing job ${job.id} for room ${roomId}: ${error.message}`
    );
    throw error;
  }
}

async function sendNotification(job) {
  try {
    console.log(`Processing job ${job.id}`);
    await createNotification(job.data);

    console.log(`Notification for job ${job.id} sent successfully.`);
  } catch (error) {
    console.error(`Error processing job ${job.id}: ${error.message}`);
    throw error;
  }
}

const initWorkers = (redis) => {
  const config = {
    connection: redis,
    concurrency: 10,
    removeOnComplete: {
      age: 1000,
      count: 10,
    },
    removeOnFail: {
      age: 60 * 1000,
    },
  };

  const roomWorker = new Worker("room-deletion", deleteRoom, config);
  roomWorker.on("completed", handleCompleted);
  roomWorker.on("failed", handleFailed);

  const messageWorker = new Worker("notification", sendNotification, config);
  messageWorker.on("completed", handleCompleted);
  messageWorker.on("failed", handleFailed);
};
export default initWorkers;
