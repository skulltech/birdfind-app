import { UpdateRelationJobResult, UpdateRelationJobData } from "@twips/common";
import { Worker } from "bullmq";
import { updateRelation } from "./core";
import { logger, connection } from "./utils";

// Start worker
const worker = new Worker<UpdateRelationJobData, UpdateRelationJobResult>(
  "update-relation",
  updateRelation,
  { connection, concurrency: 10 }
);

worker.on("error", async (error) => {
  logger.error(error.message);
});
