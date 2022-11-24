import { getFollowers, getUsers } from "./utils";

const main = async () => {
  const users = await getUsers(["summitkg", "ghuubear"]);
  console.log(users);
  const followers = await getFollowers("706786251660087296");
  console.log(followers.length);
};

main()
  .then(() => {})
  .catch((error) => {
    console.log(error);
  });
