import { Relation } from "@twips/common";
import axios from "axios";
import { parseTwitterProfile, TwitterProfile } from "./helpers";

export const lookupTwips = async (
  username: string
): Promise<TwitterProfile> => {
  const response = await axios.get("/api/twips/lookup-user", {
    params: { username: username },
  });
  if (response.status != 200) throw Error(response.data.message);
  // Check if user doesn't exist
  if (!response.data.profile) return null;

  return parseTwitterProfile(response.data.profile);
};

export const updateTwips = async (
  userId: BigInt,
  relation: Relation
): Promise<boolean> => {
  const response = await axios.get("/api/twips/update-follow-network", {
    params: { userId, relation },
  });
  if (response.status != 200) throw Error(response.data.error);
  return true;
};
