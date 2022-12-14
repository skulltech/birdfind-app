import { createClient } from "@supabase/supabase-js";
import { getTwitterClient, UpdateRelationJobInput } from "@twips/lib";
import { Queue, Worker } from "bullmq";
import * as dotenv from "dotenv";
import { updateRelation, UpdateRelationResult } from "./core";
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

worker.on("drained", () => {
  console.log("Queue is drained, no jobs available for processing");
});

worker.on("completed", async (job) => {
  const { rateLimitResetsAt, paginationToken, updatedCount } = job.returnvalue;
  const { userId, signedInUserId, relation } = job.data;

  // If it got rate limited, schedule another job
  if (rateLimitResetsAt !== undefined) {
    const delay = rateLimitResetsAt.getTime() - Date.now() + bufferMs;

    // Add a new job to the queue with delay
    const queue = new Queue<UpdateRelationJobInput, UpdateRelationResult>(
      "update-relation",
      { connection }
    );
    const jobId = `${relation}:${userId}:${paginationToken ?? null}`;
    await queue.add(
      jobId,
      { signedInUserId, userId, paginationToken, relation },
      { delay, jobId }
    );
    const delayMinutes =
      (job.returnvalue.rateLimitResetsAt.getTime() - Date.now()) / (1000 * 60);
    console.log(
      `Job "${job.name}" has completed! Updated ${updatedCount} users.${
        job.returnvalue.rateLimitResetsAt
          ? ` Scheduled another job after ${delayMinutes} minutes to get around rate limit.`
          : ""
      }`
    );
  } else
    console.log(
      `Job "${job.name}" has completed! Updated ${updatedCount} users.`
    );
});

worker.on("failed", (job, err) => {
  console.log(`$Job "${job.id}" has failed with ${err.message}`);
});
