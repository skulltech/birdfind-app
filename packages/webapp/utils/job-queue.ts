import { UpdateRelationJobResult, UpdateRelationJobData } from "@twips/common";
import { Queue } from "bullmq";

export const queue = new Queue<UpdateRelationJobData, UpdateRelationJobResult>(
  "update-relation",
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    },
  }
);
