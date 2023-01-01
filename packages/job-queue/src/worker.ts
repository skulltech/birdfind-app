import { JobName } from "@twips/common";
import { Worker } from "bullmq";
import { addListMembers } from "./add-list-members/worker";
import { updateRelation } from "./update-relation/worker";
import { logger, connection } from "./utils";

// Start worker
const worker = new Worker<number, void, JobName>(
  "twips-jobs",
  (job) => {
    return job.name == "update-relation"
      ? updateRelation(job.data)
      : job.name == "add-list-members"
      ? addListMembers(job.data)
      : null;
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
