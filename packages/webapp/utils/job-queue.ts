import { UpdateRelationJobData } from "@twips/common";
import { Queue } from "bullmq";

export const queue = new Queue<UpdateRelationJobData>("update-relation", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
});
