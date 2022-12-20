import { createClient } from "@supabase/supabase-js";
import { Queue } from "bullmq";
import { Client } from "twitter-api-sdk";
import { UpdateRelationJobInput, UpdateRelationResult } from "@twips/common";

export const supabase = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const queue = new Queue<UpdateRelationJobInput, UpdateRelationResult>(
  "update-relation",
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    },
  }
);

export const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);
