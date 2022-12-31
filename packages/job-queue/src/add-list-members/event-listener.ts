import { logger, supabase } from "../utils";

export const addListMembersJobEventListener = supabase
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
  );
