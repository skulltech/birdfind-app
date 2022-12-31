import { getPgClient, queue, sleep } from "../utils";

export const addAddListMembersJob = async () => {
  // Connect to postgres
  const pgClient = await getPgClient();

  while (true) {
    // Get active jobs
    const activeJobs = (await queue.getJobs()).filter(
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
