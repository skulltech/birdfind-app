import { SupabaseClient } from "@supabase/supabase-js";
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

type GetUpdateRelationJobParamsArgs = {
  relation: Relation;
  userId: BigInt;
  supabase: SupabaseClient;
  paginationToken?: string;
};

type GetUpdateRelationJobParamsResult = {
  jobId: string;
  jobName: string;
};

export const getUpdateRelationJobParams = async ({
  relation,
  userId,
  paginationToken,
  supabase,
}: GetUpdateRelationJobParamsArgs): Promise<GetUpdateRelationJobParamsResult> => {
  const { data, error } = await supabase
    .from("twitter_profile")
    .select("username")
    .eq("id", userId);
  if (error) throw error;
  const username = data[0].username;

  return {
    jobId: `${userId}:${relation}:${paginationToken ?? null}`,
    jobName: `Update ${relation} of @${username}${
      paginationToken ? ` with pagination token ${paginationToken}` : ""
    }`,
  };
};
