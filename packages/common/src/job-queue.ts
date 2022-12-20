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
  username?: string;
  supabase: SupabaseClient;
  paginationToken?: string;
};

type GetUpdateRelationJobParamsResult = {
  jobName: string;
  opts: any;
};

export const getUpdateRelationJobParams = async ({
  relation,
  userId,
  paginationToken,
  supabase,
  username,
}: GetUpdateRelationJobParamsArgs): Promise<GetUpdateRelationJobParamsResult> => {
  // Get username from Supabase if not provided
  if (!username) {
    const { data, error } = await supabase
      .from("twitter_profile")
      .select("username")
      .eq("id", userId);
    if (error) throw error;
    username = data[0].username;
  }

  return {
    jobName: `Update ${relation} of ${username}${
      paginationToken ? ` with pagination token ${paginationToken}` : ""
    }`,
    opts: {
      jobId: `${userId}:${relation}:${paginationToken ?? null}`,
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
    },
  };
};
