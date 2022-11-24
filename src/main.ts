import { searchUsers } from "./api";

const main = async () => {
  const result = await searchUsers({
    filters: {
      followerOf: ["summitkg"],
      followedBy: ["summitkg"],
    },
    options: {
      // useCacheOnly: false,
      // forceRefreshCache: true,
    },
  });
  console.log(result.length);
  // console.log(result);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
