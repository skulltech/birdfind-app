import winston from "winston";
import TelegramLogger from "winston-telegram";
import * as dotenv from "dotenv";
dotenv.config();

export const dedupeUsers = <T extends { id: string }>(arr: T[]) => {
  const dedupedUsers = new Set<string>();

  return arr.filter((x) => {
    if (dedupedUsers.has(x.id)) return false;
    dedupedUsers.add(x.id);
    return true;
  });
};

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.padLevels(),
        winston.format.simple()
      ),
    }),
    new TelegramLogger({
      token: process.env.TELEGRAM_API_KEY,
      chatId: parseInt(process.env.TELEGRAM_CHAT_ID),
    }),
  ],
});
