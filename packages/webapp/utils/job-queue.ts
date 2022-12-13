import {
  getQueueName,
  Relation,
  UpdateNetworkJobInput,
  UpdateNetworkResult,
} from "@twips/lib";
import { ConnectionOptions, Queue } from "bullmq";

type GetUpdateNetworkJobStatusArgs = {
  connection: ConnectionOptions;
  relation: Relation;
  jobId: string;
};

export const getUpdateNetworkJobStatus = async ({
  connection,
  relation,
  jobId,
}: GetUpdateNetworkJobStatusArgs) => {
  const queue = new Queue<UpdateNetworkJobInput, UpdateNetworkResult>(
    getQueueName(relation),
    { connection }
  );
  const job = await queue.getJob(jobId);
  return await job.getState();
};

export interface AddUpdateNetworkJobArgs extends UpdateNetworkJobInput {
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
  signedInUserId,
  userId,
}: AddUpdateNetworkJobArgs) => {
  const queue = new Queue<UpdateNetworkJobInput, UpdateNetworkResult>(
    getQueueName(relation),
    { connection }
  );

  const job = await queue.add(
    `Update ${relation} of user ${userId}`,
    { signedInUserId, userId, paginationToken },
    {
      delay,
      jobId: `${userId}::${paginationToken ?? null}`,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  return job.id;
};
