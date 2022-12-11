import { createClient } from "@supabase/supabase-js";
import { Relation, updateNetwork, UpdateNetworkResult } from "@twips/lib";
import { Queue, Worker } from "bullmq";
import { Client } from "twitter-api-sdk";
import * as dotenv from "dotenv";
dotenv.config();

// To suppress warnings
process.removeAllListeners("warning");

export interface UpdateNetworkJobInput {
  userId: BigInt;
  paginationToken?: string;
}

const redisConnection = {
  host: "localhost",
  port: 6379,
};

// 2 seconds
const bufferMs = 2 * 1000;

const getQueueName = (relation: Relation) => `update-network::${relation}`;

export const getUpdateNetworkWorker = (relation: Relation) => {
  const queueName = getQueueName(relation);

  const worker = new Worker<UpdateNetworkJobInput, UpdateNetworkResult>(
    queueName,
    async (job) => {
      const supabase = createClient(
        process.env.SUPABASE_API_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);
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
          relation,
          delay,
          paginationToken,
          userId: job.data.userId,
        });
      }
      return updateNetworkResult;
    },
    { connection: redisConnection }
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

export type AddUpdateNetworkJob = {
  relation: Relation;
  userId: BigInt;
  delay?: number;
  buffer?: number;
  paginationToken?: string;
};

export const addUpdateNetworkJob = async ({
  relation,
  delay,
  paginationToken,
  userId,
}: AddUpdateNetworkJob) => {
  const queueName = getQueueName(relation);
  const queue = new Queue<UpdateNetworkJobInput, UpdateNetworkResult>(
    queueName,
    { connection: redisConnection }
  );

  const job = await queue.add(
    `Update ${relation} of user ${userId}`,
    { userId, paginationToken },
    {
      delay,
      jobId: `${userId}::${paginationToken ?? null}`,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  return job.id;
};
