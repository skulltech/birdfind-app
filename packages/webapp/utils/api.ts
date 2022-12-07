import { Filters, TwitterUser } from "@twips/lib";
import axios from "axios";
import qs from "qs";

const parseUser = (user): TwitterUser => {
  return {
    ...user,
    id: BigInt(user.id),
    updatedAt: new Date(user.updatedAt),
    followersUpdatedAt: new Date(user.followersUpdatedAt),
    followingUpdatedAt: new Date(user.followingUpdatedAt),
    userCreatedAt: new Date(user.userCreatedAt),
  };
};

export const searchUser = async (filters: Filters) => {
  const response = await axios.get("/api/user/search", {
    params: filters,
    paramsSerializer: {
      serialize: (params) => {
        return qs.stringify(params, { arrayFormat: "repeat" });
      },
    },
  });

  if (response.status != 200) {
    throw Error(response.data.message);
  }

  const users: TwitterUser[] = response.data.users.map(parseUser);
  return users;
};

export const lookupUser = async (username: string) => {
  const response = await axios.get("/api/user/lookup", {
    params: { username: username },
  });

  if (response.status != 200) {
    throw Error(response.data.message);
  }

  // Check if user doesn't exist
  if (!response.data.user) {
    return null;
  }

  return parseUser(response.data.user);
};

export const updateUser = async (
  userId: BigInt,
  direction: "followers" | "following"
) => {
  const response = await axios.get("/api/user/update", {
    params: { userId: userId.toString(), direction },
  });
  return response.status;
};
