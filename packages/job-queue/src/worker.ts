import { Worker } from "bullmq";
import { updateFollowers } from "@twips/lib";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client } from "twitter-api-sdk";
dotenv.config();

export interface UpdateFollowersInput {
  userId: BigInt;
}

const updateFollowersWorker = new Worker<UpdateFollowersInput, void>(
  "updateFollowers",
  async (job) => {
    const supabase = createClient(
      process.env.SUPABASE_API_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);
    console.log("Updating followers of", job.data);
    await updateFollowers(job.data.userId, supabase, twitter);
  }
);

updateFollowersWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

updateFollowersWorker.on("failed", (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
