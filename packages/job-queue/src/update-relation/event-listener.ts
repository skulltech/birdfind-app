import { QueueEvents } from "bullmq";
import { logger, connection, queue } from "./utils";

const queueEvents = new QueueEvents("update-relation", { connection });

queueEvents.on("added", async ({ jobId, name }) => {
  logger.info("Job added to queue", {
    metadata: {
      jobId,
      jobName: name,
    },
  });
});

queueEvents.on("active", async ({ jobId }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has started", {
    metadata: { jobId, jobName: job.name },
  });
});

queueEvents.on("progress", async ({ jobId, data }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has progressed", {
    metadata: {
      jobId,
      jobName: job.name,
      progress: data,
    },
  });
});

queueEvents.on("completed", async ({ jobId, returnvalue }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has completed", {
    metadata: {
      jobId,
      jobName: job.name,
      result: returnvalue,
    },
  });
});

queueEvents.on("failed", async ({ jobId, failedReason }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has failed", {
    metadata: {
      jobId,
      jobName: job.name,
      failedReason,
    },
  });
});

queueEvents.on("error", async (error) => {
  logger.error(error.message);
});
