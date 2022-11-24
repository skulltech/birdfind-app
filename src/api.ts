import { getSupabaseClient } from "./utils/helpers";

// [[user1 || user2 || ...] && [user3 || user4 ||...] && ...]
export type SearchUsersArgs = {
  followedBy?: string[][];
  followerOf?: string[][];
  refreshCache?: boolean;
};

// Top level API which searches users based on filters
export const searchUsers = async ({
  followedBy,
  followerOf,
  refreshCache = false,
}: SearchUsersArgs) => {
  const supabase = getSupabaseClient();

  let finalSet: Set<string>;

  if (followedBy) {
    // Process the "followed-by" filters
    for (const followedByGroup of followedBy) {
      const { data: users, error: selectError } = await supabase
        .from("twitter_follow")
        .select("following_id")
        .in("follower_id", followedByGroup);
      if (selectError) throw selectError;

      // Take the intersection for the && operator in search
      const newSet: Set<string> = new Set(users.map((x) => x.following_id));
      if (finalSet) {
        // Take the intersection of finalSet and newSet
        const intersect = new Set<string>();
        for (const x of newSet) if (finalSet.has(x)) intersect.add(x);
        finalSet = intersect;
      } else {
        finalSet = newSet;
      }
    }
  }

  if (followerOf) {
    // Process the "follower-of" filters
    for (const followerOfGroup of followerOf) {
      const { data: users, error: selectError } = await supabase
        .from("twitter_follow")
        .select("follower_id")
        .in("following_id", followerOfGroup);
      if (selectError) throw selectError;

      // Take the intersection for the && operator in search
      const newSet: Set<string> = new Set(users.map((x) => x.follower_id));
      if (finalSet) {
        // Take the intersection of finalSet and newSet
        const intersect = new Set<string>();
        for (const x of newSet) if (finalSet.has(x)) intersect.add(x);
        finalSet = intersect;
      } else {
        finalSet = newSet;
      }
    }
  }

  return finalSet;
};
