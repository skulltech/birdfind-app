import { createClient } from "@supabase/supabase-js";
import {
  getTwitterClient,
  getUpdateRelationJobParams,
  UpdateRelationJobInput,
  UpdateRelationResult,
} from "@twips/common";
import { Queue, Worker } from "bullmq";
import * as dotenv from "dotenv";
import { updateRelation } from "./core";
import { logger } from "./utils";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
};

const supabase = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2 seconds
const bufferMs = 2 * 1000;

const worker = new Worker<UpdateRelationJobInput, UpdateRelationResult>(
  "update-relation",
  async (job) => {
    const { userId, signedInUserId, relation } = job.data;

    // Get user's oauth token from Supabase
    const { data, error } = await supabase
      .from("user_profile")
      .select("twitter_oauth_token")
      .eq("id", signedInUserId);
    if (error) throw error;
    if (!data.length) throw Error("User not found");
    const oauthToken = data[0].twitter_oauth_token;

    // Get twitter client of user
    const twitter = await getTwitterClient({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      supabase,
      userId: signedInUserId,
      oauthToken,
    });

    // Update relation
    return await updateRelation({
      userId,
      relation,
      supabase,
      twitter,
    });
  },
  { connection }
);

worker.on("completed", async (job) => {
  const { rateLimitResetsAt, paginationToken, updatedCount } = job.returnvalue;
  const { userId, signedInUserId, relation } = job.data;

  // If it got rate limited, schedule another job
  if (rateLimitResetsAt !== undefined) {
    const delay = rateLimitResetsAt.getTime() - Date.now() + bufferMs;

    // Add a new job to the queue with delay
    const { jobId, jobName } = await getUpdateRelationJobParams({
      supabase,
      relation,
      userId,
      paginationToken,
    });
    const queue = new Queue<UpdateRelationJobInput, UpdateRelationResult>(
      "update-relation",
      { connection }
    );
    await queue.add(
      jobName,
      { signedInUserId, userId, paginationToken, relation },
      { delay, jobId }
    );

    const delayMinutes =
      (job.returnvalue.rateLimitResetsAt.getTime() - Date.now()) / (1000 * 60);
    logger.log(
      "info",
      `${
        job.name
      } has completed! Updated ${updatedCount} users. Scheduled another job after ${delayMinutes.toFixed(
        1
      )} minutes to get around rate limit.`
    );
  } else
    logger.log(
      "info",
      `${job.name} has completed! Updated ${updatedCount} users.`
    );
});

worker.on("failed", (job, err) => {
  logger.log("error", `${job.name} has failed with ${err.message}.`);
});
