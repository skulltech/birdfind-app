import { Relation } from "./core";

export enum UpdateRelationJobStep {
  Execute,
  Finalize,
  Finish,
}

export type UpdateRelationJobData = {
  // Actual inputs
  signedInUserId: string;
  twitterId: BigInt;
  relation: Relation;

  // Step
  step: UpdateRelationJobStep;

  // Pagination token
  paginationToken?: string;

  // Stats
  iterationCount: number;
  updatedCount: number;
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
