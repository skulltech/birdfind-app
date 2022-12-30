import {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import { getLog } from "./update-relation/utils";
import { getPgClient, logger, queue, supabase } from "./utils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const addUpdateRelationJobs = async () => {
  // Connect to postgres
  const pgClient = await getPgClient();

  while (true) {
    // Get active jobs
    const activeJobs = (await queue.getJobs(["active", "waiting"])).filter(
      (x) => x.name == "update-relation"
    );

    // Get jobs which can be added
    const result = await pgClient.query({
      text: "select id from get_update_relation_jobs_to_add($1)",
      values: [activeJobs.map((x) => x.data)],
    });
    const jobIds = result.rows.map((x) => x.id);

    // Add jobs
    for (const jobId of jobIds) await queue.add("update-relation", jobId);

    // Sleep for 2 seconds
    await sleep(2 * 1000);
  }
};

// Run loop for adding update-relation jobs
addUpdateRelationJobs().catch((error) =>
  logger.error("Error at daemon while adding update-relation jobs", {
    metadata: { error },
  })
);

const addAddListMembersJob = async () => {
  // Connect to postgres
  const pgClient = await getPgClient();

  while (true) {
    // Get active jobs
    const activeJobs = (await queue.getJobs(["active", "waiting"])).filter(
      (x) => x.name == "add-list-members"
    );

    // Get jobs which can be added
    const result = await pgClient.query({
      text: "select id from get_add_list_members_jobs_to_add($1)",
      values: [activeJobs.map((x) => x.data)],
    });
    const jobIds = result.rows.map((x) => x.id);

    // Add jobs
    for (const jobId of jobIds) await queue.add("add-list-members", jobId);

    // Sleep for 2 seconds
    await sleep(2 * 1000);
  }
};

// Run loop for adding add-list-members jobs
addAddListMembersJob().catch((error) =>
  logger.error("Error at daemon while adding add-list-members jobs", {
    metadata: { error },
  })
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

// Add event listener for changes in update_relation_job
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

// Add event listener for changes in add_list_members_job
supabase
  .channel("public:add_list_members_job")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "add_list_members_job" },
    (payload) =>
      logger.info("Job created: add-list-member", { metadata: payload })
  )
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "add_list_members_job" },
    (payload) =>
      logger.info("Job updated: add-list-member", { metadata: payload })
  )
  .subscribe();
