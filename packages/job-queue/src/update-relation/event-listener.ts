import { QueueEvents } from "bullmq";
import { logger, connection, queue } from "./utils";
import ms from "ms";

const queueEvents = new QueueEvents("update-relation", { connection });

queueEvents.on("added", async ({ jobId, name }) => {
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
      jobData: job.data,
    },
  });
});

queueEvents.on("progress", async ({ jobId, data }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has progressed", {
    metadata: {
      jobId,
      jobData: job.data,
      progress: data,
    },
  });
});

queueEvents.on("completed", async ({ jobId }) => {
  const job = await queue.getJob(jobId);

  try {
    logger.info("Job has completed", {
      metadata: {
        jobId,
        jobData: job.data,
        result: {
          message: job.returnvalue.rateLimitResetsAt
            ? "Scheduled another job after getting rate limited"
            : "Completed fetching all users",
          totalUpdatedCount: job.returnvalue.totalUpdatedCount,
          iterationCompletedIn: ms(Date.now() - job.processedOn),
          batchCompletedIn: job.returnvalue.rateLimitResetsAt
            ? null
            : ms(
                Date.now() -
                  (job.data.continuationParams
                    ? job.data.continuationParams.initialProcessedAt.getTime()
                    : job.processedOn)
              ),
          totalIterations: job.data.continuationParams
            ? job.data.continuationParams.iterationCount + 1
            : 1,
          nextJobIn: job.returnvalue.rateLimitResetsAt
            ? ms(
                new Date(job.returnvalue.rateLimitResetsAt).getTime() -
                  Date.now()
              )
            : null,
        },
      },
    });
  } catch (error) {
    console.log(error);
    console.log(
      job.returnvalue.rateLimitResetsAt,
      typeof job.returnvalue.rateLimitResetsAt
    );
  }
});

queueEvents.on("failed", async ({ jobId, failedReason }) => {
  const job = await queue.getJob(jobId);
  logger.info("Job has failed", {
    metadata: {
      jobId,
      jobData: job.data,
      failedReason,
    },
  });
});

queueEvents.on("error", async (error) => {
  logger.error(error.message);
});
