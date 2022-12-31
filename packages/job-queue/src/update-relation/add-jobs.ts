import { getPgClient, queue, sleep } from "../utils";

export const addUpdateRelationJobs = async () => {
  // Connect to postgres
  const pgClient = await getPgClient();

  while (true) {
    // Get jobs from queue
    const activeJobs = (await queue.getJobs(["active", "waiting"]))
      .filter((x) => x.name == "update-relation")
      .map((x) => x.data);

    const failedJobs = (await queue.getFailed())
      .filter((x) => x.name == "update-relation")
      .map((x) => x.data);

    // Get jobs which can be added
    const result = await pgClient.query({
      text: "select id from get_update_relation_jobs_to_add($1, $2)",
      values: [activeJobs, failedJobs],
    });
    const jobIds = result.rows.map((x) => x.id);

    // Add jobs
    for (const jobId of jobIds) await queue.add("update-relation", jobId);

    // Sleep for 2 seconds
    await sleep(2 * 1000);
  }
};
