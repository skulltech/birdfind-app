import { UpdateRelationJobInput, UpdateRelationResult } from "@twips/common";
import { QueueEvents, Worker } from "bullmq";
import * as dotenv from "dotenv";
import { updateRelation } from "./core";
import { logger, connection, queue } from "./utils";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

// Start worker
const worker = new Worker<UpdateRelationJobInput, UpdateRelationResult>(
  "update-relation",
  updateRelation,
  // Concurrency is 5
  { connection, concurrency: 5 }
);

worker.on("error", async (error) => {
  logger.error(error.message);
});

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
