import { Relation } from "./core";

export const getQueueName = (relation: Relation) =>
  "update-network:" + relation;

export type UpdateNetworkJobInput = {
  signedInUserId: string;
  userId: BigInt;
  paginationToken?: string;
};
