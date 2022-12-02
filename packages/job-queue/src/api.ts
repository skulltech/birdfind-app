import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import { addUpdateNetworkJob } from "./workers/update-network/common";
import { AddressInfo } from "net";
import * as dotenv from "dotenv";
dotenv.config();

const server: FastifyInstance = Fastify({});

interface QueryString {
  key: string;
  userId: BigInt;
  direction: "followers" | "following";
}

const opts: RouteShorthandOptions = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        userId: { type: "integer" },
        key: { type: "string" },
        direction: { type: "string", enum: ["followers", "following"] },
      },
      required: ["userId", "key", "direction"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
          jobId: { type: "string" },
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
  "/update-network",
  opts,
  async (request, reply) => {
    if (request.query.key != process.env.API_KEY) {
      reply.code(401);
      return { message: "Not authenticated" };
    }

    const { direction, userId } = request.query;
    const jobId = await addUpdateNetworkJob({ direction, userId });

    return {
      message: "Successfully added job to queue",
      jobId,
    };
  }
);

const start = async () => {
  try {
    await server.listen({ port: 4000 });
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
