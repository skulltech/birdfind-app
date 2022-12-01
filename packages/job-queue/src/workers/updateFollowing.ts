import { createClient } from "@supabase/supabase-js";
import { updateFollowing } from "@twips/lib";
import { Worker } from "bullmq";
import { Client } from "twitter-api-sdk";
import { JobInput } from "./types";
import * as dotenv from "dotenv";
dotenv.config();

const updateFollowingWorker = new Worker<JobInput, void>(
  "update-following",
  async (job) => {
    const supabase = createClient(
      process.env.SUPABASE_API_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);
    await updateFollowing(job.data.userId, supabase, twitter);
  }
);

updateFollowingWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

updateFollowingWorker.on("failed", (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
