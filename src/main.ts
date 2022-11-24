import {
  getFollowers,
  getFollowersFromCache,
  getUsers,
  getUsersFromCache,
} from "./utils";

const main = async () => {
  const users = await getUsersFromCache(["summitkg", "ghuubear"]);
  console.log(users);
  // const followers = await getFollowersFromCache("706786251660087296");
  // console.log(followers);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
