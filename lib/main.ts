import { searchUsers } from "./search";

const main = async () => {
  const result = await searchUsers({
    filters: {
      followerOf: ["summitkg"],
      followedBy: ["summitkg"],
      tweetCountGreaterThan: 1000,
      followersCountGreaterThan: 100,
      createdBefore: new Date(2016, 1, 1),
    },
    options: {
      // useCacheOnly: false,
      // forceRefreshCache: true,
    },
  });
  console.log(result.length);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
