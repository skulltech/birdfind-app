import { getFollowers, updateFollowers } from "./utils/followers";
import { getFollowing, updateFollowing } from "./utils/following";
import { getIntersection } from "./utils/helpers";
import { Filters } from "./utils/types";
import {
  getUserIds,
  getUsersByIds,
  getUsersByUsernames,
  updateUsers,
} from "./utils/users";

// 10 hours
export const defaultCacheTimeout = 10 * 60 * 60 * 1000;

export type SearchUsersArgs = {
  filters: Filters;
  options?: {
    useCacheOnly?: boolean;
    forceRefreshCache?: boolean;
    cacheTimeout?: number;
  };
};

// Top level API which searches users based on filters
export const searchUsers = async ({
  filters: { followedBy, followerOf, ...generalFilters },
  options,
}: SearchUsersArgs) => {
  const {
    useCacheOnly = false,
    forceRefreshCache = false,
    cacheTimeout = defaultCacheTimeout,
  } = options ?? {};

  // Make sure all input users are cached in DB
  const inputUsernames = Array.from(
    new Set([...(followedBy ?? []), ...(followerOf ?? [])])
  );
  const cachedUsers = await getUsersByUsernames(inputUsernames);
  const uncachedUsers = inputUsernames.filter(
    (x) => !cachedUsers.map((x) => x.username).includes(x)
  );
  if (uncachedUsers.length) await updateUsers(uncachedUsers);

  let resultUserIds: Set<BigInt>;

  // Process the "followed-by" filters
  if (followedBy) {
    const followersIds = await getUserIds(followedBy);

    // Update cache if needed
    let toUpdate: BigInt[] = [];
    if (!useCacheOnly) {
      if (forceRefreshCache) toUpdate = followersIds;
      else {
        const users = await getUsersByIds(followersIds);
        toUpdate = users
          .filter(
            (x) => Date.now() - x.followingUpdatedAt.getTime() >= cacheTimeout
          )
          .map((x) => x.id);
      }
    }
    if (toUpdate.length)
      for (const followingId of toUpdate) await updateFollowing(followingId);

    // Get data from cache and take intersection
    for (const followerId of followersIds) {
      const following = await getFollowing(followerId);
      resultUserIds = getIntersection(new Set(following), resultUserIds);
    }
  }

  // Process the "follower-of" filters
  if (followerOf) {
    const followingIds = await getUserIds(followerOf);

    // Update cache if needed
    let toUpdate: BigInt[] = [];
    if (!useCacheOnly) {
      if (forceRefreshCache) toUpdate = followingIds;
      else {
        const users = await getUsersByIds(followingIds);
        toUpdate = users
          .filter(
            (x) => Date.now() - x.followersUpdatedAt.getTime() >= cacheTimeout
          )
          .map((x) => x.id);
      }
    }
    if (toUpdate.length)
      for (const followingId of toUpdate) await updateFollowers(followingId);

    // Get data from cache and take intersection
    for (const followingId of followingIds) {
      const followers = await getFollowers(followingId);
      resultUserIds = getIntersection(new Set(followers), resultUserIds);
    }
  }

  return await getUsersByIds([...resultUserIds], generalFilters);
};
