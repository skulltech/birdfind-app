import { createClient } from "@supabase/supabase-js";
import { Client } from "twitter-api-sdk";
import * as dotenv from "dotenv";
dotenv.config();

// 1 minutes
export const defaultCacheTimeout = 1 * 60 * 1000;

// Util functions
export const getTwitterClient = () =>
  new Client(process.env.TWITTER_BEARER_TOKEN);
export const getSupabaseClient = () =>
  createClient(process.env.SUPABASE_API_URL, process.env.SUPABASE_KEY);
