import { QueueEvents } from "bullmq";

const handleWaiting = ({ jobId }) => {
  console.log(`A job with ID ${jobId} is waiting`);
};

const handleActive = ({ jobId, prev }) => {
  console.log(`Job ${jobId} is now active; previous status was ${prev}`);
};

const handleCompleted = ({ jobId }) => {
  console.log(`${jobId} has completed`);
};

const handleProgress = ({ jobId, data }, timestamp) => {
  console.log(`${jobId} reported progress ${data} at ${timestamp}`);
};

const handleFailed = ({ jobId, failedReason }) => {
  console.log(`${jobId} has failed with reason ${failedReason}`);
};

export const initRoomEvents = (queueName, redis) => {
  const queueEvents = new QueueEvents(queueName, { connection: redis });

  queueEvents.on("completed", handleCompleted);
  queueEvents.on("progress", handleProgress);
  queueEvents.on("waiting", handleWaiting);
  queueEvents.on("active", handleActive);
  queueEvents.on("failed", handleFailed);

  return queueEvents;
};

export const initMessageEvents = (queueName, redis) => {
  const queueEvents = new QueueEvents(queueName, { connection: redis });

  queueEvents.on("completed", handleCompleted);
  queueEvents.on("progress", handleProgress);
  queueEvents.on("waiting", handleWaiting);
  queueEvents.on("active", handleActive);
  queueEvents.on("failed", handleFailed);

  return queueEvents;
};
