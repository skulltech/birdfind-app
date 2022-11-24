import { getFollowers, updateFollowers } from "./utils/followers";
import { getFollowings, updateFollowings } from "./utils/followings";
import { getIntersection, getSupabaseClient } from "./utils/helpers";
import {
  getUserIds,
  getUsersByIds,
  getUsersByUsernames,
  updateUsers,
} from "./utils/users";

export type SearchUsersArgs = {
  followedBy?: string[];
  followerOf?: string[];
  refreshCache?: boolean;
};

// Top level API which searches users based on filters
export const searchUsers = async ({
  followedBy,
  followerOf,
  refreshCache = false,
}: SearchUsersArgs) => {
  // Make sure all input users are cached in DB
  const inputUsernames = [...(followedBy ?? []), ...(followerOf ?? [])];
  const cachedUsers = await getUsersByUsernames(inputUsernames);
  const uncachedUsers = inputUsernames.filter(
    (x) => !cachedUsers.map((x) => x.username).includes(x)
  );
  if (uncachedUsers.length) await updateUsers(uncachedUsers);

  let resultUserIds: Set<BigInt>;

  // Process the "followed-by" filters
  if (followedBy) {
    const followersIds = await getUserIds(followedBy);
    for (const followerId of followersIds) {
      if (refreshCache) await updateFollowings(followerId);
      const followings = await getFollowings(followerId);
      resultUserIds = getIntersection(new Set(followings), resultUserIds);
    }
  }

  // Process the "follower-of" filters
  if (followerOf) {
    const followingIds = await getUserIds(followerOf);
    for (const followingId of followingIds) {
      if (refreshCache) await updateFollowers(followingId);
      const followers = await getFollowers(followingId);
      resultUserIds = getIntersection(new Set(followers), resultUserIds);
    }
  }

  const resultUsers = await getUsersByIds([...resultUserIds]);
  return resultUsers;
};
