import { UpdateRelationJobInput, UpdateRelationResult } from "@twips/lib";
import { Queue } from "bullmq";

export const queue = new Queue<UpdateRelationJobInput, UpdateRelationResult>(
  "update-relation",
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    },
  }
);
