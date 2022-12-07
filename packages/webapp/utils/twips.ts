import { parseTwitterProfiles, TwitterProfile } from "@twips/lib";
import axios from "axios";

export const lookupTwips = async (
  username: string
): Promise<TwitterProfile> => {
  const response = await axios.get("/api/twips/lookup", {
    params: { username: username },
  });
  if (response.status != 200) throw Error(response.data.message);

  // Check if user doesn't exist
  if (!response.data.profile) return null;

  return parseTwitterProfiles([response.data.profile])[0];
};

export const updateTwips = async (
  userId: BigInt,
  direction: "followers" | "following"
) => {
  const response = await axios.get("/api/twips/update", {
    params: { userId: userId.toString(), direction },
  });
  return response.status;
};
