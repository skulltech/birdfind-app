import { Worker } from "bullmq";
import { updateRelation } from "./core";
import { logger, connection } from "./utils";

// Start worker
const worker = new Worker<string>(
  "update-relation",
  (job) => updateRelation(job.data),
  {
    connection,
    concurrency: 10,
    maxStalledCount: 10,
  }
);

worker.on("error", (error) => {
  logger.error("Worker error", { metadata: { error } });
});
