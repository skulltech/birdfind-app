import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import * as dotenv from "dotenv";
import { Queue } from "bullmq";
import { JobInput } from "./workers/types";
import { AddressInfo } from "net";
dotenv.config();

const server: FastifyInstance = Fastify({});

interface QueryString {
  key: string;
  userId: BigInt;
}

const opts: RouteShorthandOptions = {
  schema: {
    params: {
      type: "object",
      properties: {
        userId: { type: "integer" },
        key: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
          queue: { type: "string" },
          jobId: { type: "integer" },
        },
      },
      401: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};

server.get<{ Querystring: QueryString }>(
  "/updateFollowers",
  opts,
  async (request, reply) => {
    if (request.query.key != process.env.API_KEY) {
      reply.code(401);
      return { message: "Not authenticated" };
    }

    const updateFollowersQueue = new Queue<JobInput>("update-followers");
    await updateFollowersQueue.add(
      request.query.userId.toString(),
      {
        userId: request.query.userId,
      },
      { jobId: request.query.userId.toString() }
    );

    return {
      message: "Successfully added job to queue",
      queue: "update-followers",
      jobId: request.query.userId,
    };
  }
);

server.get<{ Querystring: QueryString }>(
  "/updateFollowing",
  opts,
  async (request, reply) => {
    if (request.query.key != process.env.API_KEY) {
      reply.code(401);
      return { message: "Not authenticated" };
    }

    const updateFollowingQueue = new Queue<JobInput>("update-following");
    await updateFollowingQueue.add(
      request.query.userId.toString(),
      {
        userId: request.query.userId,
      },
      { jobId: request.query.userId.toString() }
    );

    return {
      message: "Successfully added job to queue",
      queue: "update-following",
      jobId: request.query.userId,
    };
  }
);

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    const address = server.server.address() as AddressInfo;
    console.log(
      `Job queue's API server listening at ${address.address}:${address.port}`
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
