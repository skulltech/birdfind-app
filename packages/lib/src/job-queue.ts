import { ConnectionOptions, Queue } from "bullmq";
import { Relation, UpdateNetworkResult } from "./core";

export const getQueueName = (relation: Relation) =>
  `update-network::${relation}`;

export interface UpdateNetworkJobInput {
  signedInUserId: string;
  twitterUserId: BigInt;
  paginationToken?: string;
}

export interface AddUpdateNetworkJob extends UpdateNetworkJobInput {
  connection: ConnectionOptions;
  relation: Relation;
  delay?: number;
  buffer?: number;
}

export const addUpdateNetworkJob = async ({
  connection,
  relation,
  delay,
  paginationToken,
  userId,
  targetUserTwitterId,
}: AddUpdateNetworkJob) => {
  const queueName = getQueueName(relation);
  const queue = new Queue<UpdateNetworkJobInput, UpdateNetworkResult>(
    queueName,
    { connection }
  );

  const job = await queue.add(
    `Update ${relation} of user ${userId}`,
    { twitterUserId, userId, paginationToken },
    {
      delay,
      jobId: `${userId}::${paginationToken ?? null}`,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  return job.id;
};
