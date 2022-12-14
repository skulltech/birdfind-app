import { Relation } from "./core";

export type UpdateRelationJobInput = {
  signedInUserId: string;
  relation: Relation;
  userId: BigInt;
  paginationToken?: string;
};

export type UpdateRelationResult = {
  updatedCount: number;
  paginationToken?: string;
  rateLimitResetsAt?: Date;
};
