import { Worker } from "bullmq";
import { addListMembers } from "./add-list-members/core";
import { updateRelation } from "./update-relation/core";
import { logger, connection, JobName } from "./utils";

// Start worker
const worker = new Worker<number, void, JobName>(
  "twips-jobs",
  (job) => {
    if (job.name == "update-relation") return updateRelation(job.data);
    if (job.name == "add-list-members") return addListMembers(job.data);
  },
  {
    connection,
    concurrency: 10,
    maxStalledCount: 10,
  }
);

worker.on("error", (error) => {
  logger.error("Worker error", { metadata: { error } });
});
