import { searchUsers } from "./search";

const main = async () => {
  const result = await searchUsers({
    filters: {
      followerOf: ["summitkg", "philomathamit", "ghuubear"],
      // followedBy: ["summitkg"],
      tweetCountGreaterThan: 200,
      followersCountGreaterThan: 10,
      // createdBefore: new Date(2016, 1, 1),
    },
    options: {
      // useCacheOnly: false,
      // forceRefreshCache: true,
    },
  });
  console.log(result);
  console.log(result.length);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
