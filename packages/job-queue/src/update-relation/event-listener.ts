import { QueueEvents } from "bullmq";
import { logger, connection, queue } from "./utils";

const queueEvents = new QueueEvents("update-relation", { connection });

queueEvents.on("added", async ({ jobId }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job added to queue", {
    metadata: {
      jobId,
      jobData: job.data,
    },
  });
});

queueEvents.on("active", async ({ jobId }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has started", {
    metadata: {
      jobId,
      ...job.data,
    },
  });
});

queueEvents.on("progress", async ({ jobId, data }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has progressed", {
    metadata: {
      jobId,
      ...job.data,
      progress: data,
    },
  });
});

queueEvents.on("completed", async ({ jobId }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has completed", {
    metadata: {
      jobId,
      ...job.data,
    },
  });
});

queueEvents.on("failed", async ({ jobId, failedReason }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has failed", {
    metadata: {
      jobId,
      ...job.data,
      failedReason,
    },
  });
});

queueEvents.on("error", async (error) => {
  logger.error("Queue events error", { metadata: { error } });
});
