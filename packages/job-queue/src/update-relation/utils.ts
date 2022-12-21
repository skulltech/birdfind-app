import winston from "winston";
import TelegramLogger from "winston-telegram";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ConnectionOptions, Queue } from "bullmq";
import { UpdateRelationJobInput, UpdateRelationResult } from "@twips/common";
dotenv.config();

export const dedupeUsers = <T extends { id: string }>(arr: T[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

const formatTelegramMessage = ({ level, message, metadata }) => `
<strong>[${level}]</strong> ${message}
<pre>${JSON.stringify(metadata, null, 2)
  .replaceAll("{", "")
  .replaceAll("}", "")
  .replaceAll('"', "")
  .replaceAll(",", "")
  .split("\n")
  .map((x) => x.slice(2, x.length))
  .join("\n")}</pre>
`;

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new TelegramLogger({
      token: process.env.TELEGRAM_API_KEY,
      chatId: parseInt(process.env.TELEGRAM_CHAT_ID),
      parseMode: "HTML",
      formatMessage: formatTelegramMessage,
    }),
  ],
});

export const supabase = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

export const queue = new Queue<UpdateRelationJobInput, UpdateRelationResult>(
  "update-relation",
  { connection }
);
