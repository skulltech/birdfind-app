import { logger, supabase } from "./utils";

supabase
  .channel("*")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "update_relation_job",
    },
    (payload) => {
      if (payload.eventType === "INSERT")
        logger.info("Job added", {
          metadata: {
            ...payload.new,
            commit_timestamp: payload.commit_timestamp,
          },
        });
      if (payload.eventType === "UPDATE")
        logger.info(payload.new.finished ? "Job finished" : "Job progressed", {
          metadata: {
            ...payload.new,
            commit_timestamp: payload.commit_timestamp,
          },
        });
    }
  )
  .subscribe();
