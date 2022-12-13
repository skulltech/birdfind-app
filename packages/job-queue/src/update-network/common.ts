import { createClient } from "@supabase/supabase-js";
import {
  addUpdateNetworkJob,
  getQueueName,
  getTwitterClient,
  Relation,
  updateNetwork,
  UpdateNetworkJobInput,
  UpdateNetworkResult,
} from "@twips/lib";
import { Worker } from "bullmq";
import * as dotenv from "dotenv";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
};

const twitterSecrets = {
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
};

// 2 seconds
const bufferMs = 2 * 1000;

export const getUpdateNetworkWorker = (relation: Relation) => {
  const queueName = getQueueName(relation);

  const worker = new Worker<UpdateNetworkJobInput, UpdateNetworkResult>(
    queueName,
    async (job) => {
      const supabase = createClient(
        process.env.SUPABASE_API_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { userId } = job.data;

      // Get user's oauth token from Supabase
      const { data, error } = await supabase
        .from("user_profile")
        .select("twitter_oauth_token")
        .eq("id", userId);
      if (error) throw error;
      if (!data.length) throw Error("User not found");
      const oauthToken = data[0].twitter_oauth_token;

      const twitter = getTwitterClient({
        ...twitterSecrets,
        supabase,
        userId,
        oauthToken,
      });
      const updateNetworkResult = await updateNetwork({
        userId: job.data.userId,
        relation,
        supabase,
        twitter,
      });
      const { rateLimitResetsAt, paginationToken } = updateNetworkResult;

      if (rateLimitResetsAt !== undefined) {
        const delay = rateLimitResetsAt.getTime() - Date.now() + bufferMs;
        await addUpdateNetworkJob({
          connection,
          relation,
          delay,
          paginationToken,
          userId: job.data.userId,
        });
      }
      return updateNetworkResult;
    }
  );

  worker.on("completed", (job) => {
    const { rateLimitResetsAt, updatedCount } = job.returnvalue;
    if (rateLimitResetsAt) {
      const delayMinutes =
        (job.returnvalue.rateLimitResetsAt.getTime() - Date.now()) /
        (1000 * 60);
      console.log(
        `${queueName}: ${job.id} has completed! Updated ${
          job.returnvalue.updatedCount
        } users.${
          job.returnvalue.rateLimitResetsAt
            ? ` Scheduled another job after ${delayMinutes} minutes to get around rate limit.`
            : ""
        }`
      );
    } else {
      console.log(
        `${queueName}: ${job.id} has completed! Updated ${job.returnvalue.updatedCount} users.`
      );
    }
  });

  worker.on("failed", (job, err) => {
    console.log(`${queueName}: ${job.id} has failed with ${err.message}`);
  });

  return worker;
};
