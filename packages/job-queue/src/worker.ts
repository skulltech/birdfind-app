import { JobName } from "@birdfind/common";
import { Worker } from "bullmq";
import { logger, connection } from "./utils";
import { runCampaign } from "./run-campaign/worker";

// Start worker
const worker = new Worker<number, void, JobName>(
  "birdfind-jobs",
  (job) => {
    return job.name == "run-campaign" ? runCampaign(job.data) : null;
  },
  {
    connection,
    concurrency: 10,
    maxStalledCount: 10,
  }
);

worker.on("failed", (job, error) => {
  logger.error("Worker failed", {
    metadata: { error, job: { name: job.name, id: job.id } },
  });
});

worker.on("error", (error) => {
  logger.error("Worker error", { metadata: { error } });
});
