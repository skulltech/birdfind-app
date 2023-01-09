import { JobName } from "@twips/common";
import { Worker } from "bullmq";
import { manageListMembers } from "./manage-list-members/worker";
import { lookupRelation } from "./lookup-relation/worker";
import { logger, connection } from "./utils";
import { manageRelation } from "./manage-relation/worker";

// Start worker
const worker = new Worker<number, void, JobName>(
  "twips-jobs",
  (job) => {
    return job.name == "lookup-relation"
      ? lookupRelation(job.data)
      : job.name == "manage-list-members"
      ? manageListMembers(job.data)
      : job.name == "manage-relation"
      ? manageRelation(job.data)
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
