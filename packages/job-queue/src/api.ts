import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import { addUpdateNetworkJob } from "./workers/update-network/common";
import { AddressInfo } from "net";
import * as dotenv from "dotenv";
import { Relation, relations } from "@twips/lib";
dotenv.config();

const server: FastifyInstance = Fastify({});

interface QueryString {
  key: string;
  userId: BigInt;
  relation: Relation;
}

const opts: RouteShorthandOptions = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        userId: { type: "string" },
        key: { type: "string" },
        relation: {
          type: "string",
          enum: relations,
        },
      },
      required: ["userId", "key", "relation"],
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
  "/network/update",
  opts,
  async (request, reply) => {
    if (request.query.key != process.env.API_KEY) {
      reply.code(401);
      return { message: "Not authenticated" };
    }

    const { relation, userId } = request.query;
    const jobId = await addUpdateNetworkJob({ relation, userId });

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
