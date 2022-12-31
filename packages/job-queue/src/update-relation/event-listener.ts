import {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import { logger, supabase } from "../utils";
import { getLog } from "./utils";

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

export const updateRelationJobEventListener = supabase
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
  );
