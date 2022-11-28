import { createClient } from "@supabase/supabase-js";
import Client from "twitter-api-sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Util functions
export const getTwitterClient = () =>
  new Client(process.env.TWITTER_BEARER_TOKEN);
export const getSupabaseClient = () =>
  createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_KEY);
