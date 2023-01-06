import { twitter } from "./utils";

export const lookupTwitterUser = async (id: string) => {
  const { data } = await twitter.users.findUserById(id);
  console.info(data);
};
