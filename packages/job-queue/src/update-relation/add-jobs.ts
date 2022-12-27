import { logger, queue, supabase } from "./utils";

const main = async () => {
  while (true) {
    // Get active jobs
    const activeJobs = await queue.getActive();

    // Get jobs which can be added
    const { data: jobs, error: selectJobsError } = await supabase.rpc(
      "get_update_relation_jobs_to_add",
      { active_jobs: activeJobs.map((x) => x.data) }
    );
    if (selectJobsError) throw selectJobsError;
    const jobsToAdd = jobs as any[];

    // Add jobs
    for (const job of jobsToAdd)
      await queue.add("Update relation", job.id, {
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

main().catch((error) =>
  logger.error("Error at add-jobs", { metadata: { error } })
);
