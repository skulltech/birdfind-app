import { searchUsers } from "./api";

const main = async () => {
  const result = await searchUsers({
    followerOf: ["summitkg", "jr_sachdeva", "ghuubear"],
    // refreshCache: true,
    followedBy: ["summitkg"],
  });
  console.log(result.length);
  console.log(result);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
