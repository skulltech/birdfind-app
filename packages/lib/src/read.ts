import { SupabaseClient } from "@supabase/supabase-js";
import Client from "twitter-api-sdk";
import { Filters } from "./utils/types";
import { getUsers, getUsersByFilters } from "./utils/users";

// 10 hours
export const defaultCacheTimeout = 10 * 60 * 60 * 1000;

export type SearchUsersArgs = {
  filters: Filters;
  supabase: SupabaseClient;
  twitter: Client;
  options?: {
    useCacheOnly?: boolean;
    forceRefreshCache?: boolean;
    cacheTimeout?: number;
  };
};

// export const getCacheStatus = async ({
//   followedBy,
//   followerOf,
//   supabase,
//   twitter,
// }) => {
//   // Make sure all input users are cached in DB
//   const inputUsernames = Array.from(
//     new Set([...(followedBy ?? []), ...(followerOf ?? [])])
//   );
//   const cachedUsers = await getUsersByUsernames(inputUsernames, supabase);
//   const uncachedUsers = inputUsernames.filter(
//     (x) => !cachedUsers.map((x) => x.username).includes(x)
//   );
//   if (uncachedUsers.length) await updateUsers(uncachedUsers, supabase, twitter);

//   // Update cache if need for "followed-by" filters
//   if (followedBy) {
//     let toUpdate: BigInt[] = [];
//     if (!useCacheOnly) {
//       if (forceRefreshCache) toUpdate = followersIds;
//       else {
//         const users = await getUsersByIds(followersIds, supabase);
//         toUpdate = users
//           .filter(
//             (x) => Date.now() - x.followingUpdatedAt.getTime() >= cacheTimeout
//           )
//           .map((x) => x.id);
//       }
//     }
//     if (toUpdate.length)
//       for (const followingId of toUpdate)
//         await updateNetwork({
//           direction: "following",
//           userId: followingId,
//           supabase,
//           twitter,
//         });
//   }

//   // Update cache if need for "follower-of" filters
//   if (followerOf) {
//     let toUpdate: BigInt[] = [];
//     if (!useCacheOnly) {
//       if (forceRefreshCache) toUpdate = followingIds;
//       else {
//         const users = await getUsersByIds(followingIds, supabase);
//         toUpdate = users
//           .filter(
//             (x) => Date.now() - x.followersUpdatedAt.getTime() >= cacheTimeout
//           )
//           .map((x) => x.id);
//       }
//     }
//     if (toUpdate.length)
//       for (const followingId of toUpdate)
//         await updateNetwork({
//           userId: followingId,
//           direction: "followers",
//           supabase,
//           twitter,
//         });
//   }
// };

// Top level API which searches users based on filters
export const searchUsers = async ({
  filters,
  supabase,
  twitter,
  options,
}: SearchUsersArgs) => {
  const { followedBy, followerOf } = filters;

  const followers = followedBy
    ? await getUsers({ usernames: followedBy, supabase })
    : [];
  const following = followerOf
    ? await getUsers({ usernames: followerOf, supabase })
    : [];

  return await getUsersByFilters(supabase, {
    ...filters,
    followerOf: following.map((x) => x.id),
    followedBy: followers.map((x) => x.id),
  });
};
