import { Relation } from "./core";

export type UpdateRelationJobResult = {
  totalUpdatedCount: number;
  rateLimitResetsAt: string;
};

export type UpdateRelationJobData = {
  signedInUserId: string;
  relation: Relation;
  userId: BigInt;
  // Exists means it's a continuation job in a batch
  continuationParams?: {
    // Pagination token this job is starts with
    paginationToken: string;
    // Total no. of completed iterations in the batch so far
    iterationCount: number;
    // No. of updated users so far in past jobs of this batch
    totalUpdatedCount: number;
    // Timestamp of when the first job of this batch was added
    initialProcessedAt: Date;
  };
  // Human readable data for better logging
  humanReadable?: {
    signedInUser: {
      email: string;
      username: string;
    };
    username: string;
  };
};

export const updateRelationJobOpts = {
  // Keep up to 1 hour and 100 jobs
  removeOnComplete: {
    age: 1 * 3600,
    count: 100,
  },
  // Keep up to 48 hours and 1000 jobs
  removeOnFail: {
    age: 48 * 3600,
    count: 1000,
  },
};
