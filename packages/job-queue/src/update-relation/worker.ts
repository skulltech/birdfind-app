import { UpdateRelationJobData } from "@twips/common";
import { Worker } from "bullmq";
import { updateRelation } from "./core";
import { logger, connection } from "./utils";

// Start worker
const worker = new Worker<UpdateRelationJobData>(
  "update-relation",
  updateRelation,
  { connection, concurrency: 10, maxStalledCount: 10 }
);

worker.on("error", (error) => {
  logger.error("Worker error", { metadata: { error: error.message } });
});
