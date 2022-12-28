import {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import { logger, pgClient, getLog, queue, supabase } from "./utils";

const addJobs = async () => {
  // Connect to postgres
  await pgClient.connect();

  while (true) {
    // Get active jobs
    const activeJobs = await queue.getActive();

    // Get jobs which can be added
    const result = await pgClient.query({
      text: "select id from get_update_relation_jobs_to_add($1)",
      values: [activeJobs.map((x) => x.data)],
    });
    const jobIds = result.rows.map((x) => x.id);

    // Add jobs
    for (const jobId of jobIds)
      await queue.add("Update relation", jobId, {
        // Keep up to 1 hour and 100 jobs
        removeOnComplete: {
          age: 1 * 3600,
          count: 100,
        },
        // Keep up to 48 hours and 1000 jobs
        removeOnFail: {
          age: 48 * 3600,
          count: 1000,
        },
      });
  }
};

// Run main loop
addJobs().catch((error) =>
  logger.error("Error at daemon while adding jobs", { metadata: { error } })
);

const handleEvent = async (
  payload:
    | RealtimePostgresInsertPayload<{ [key: string]: any }>
    | RealtimePostgresUpdatePayload<{ [key: string]: any }>
) => {
  try {
    logger.info(payload.new.finished ? "Job finished" : "Job progressed", {
      metadata: await getLog(payload.new.id),
    });
  } catch (error) {
    logger.error("Error at daemon while logging event", {
      metadata: { error },
    });
  }
};

// Add event-listener for changes in database
supabase
  .channel("public:update_relation_job")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "update_relation_job" },
    handleEvent
  )
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "update_relation_job" },
    handleEvent
  )
  .subscribe();
