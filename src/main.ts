import { searchUsers } from "./api";
import { getFollowersFromCache, updateFollowers } from "./utils/followers";
import { getUsersFromCache } from "./utils/users";

const main = async () => {
  // await updateFollowers("706786251660087296");
  // await updateFollowers("3014351569");
  const result = await searchUsers({
    followerOf: [["706786251660087296"], ["3014351569"]],
  });
  console.log(result);
  // const followers = await getFollowersFromCache("706786251660087296");
  // console.log(followers);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
