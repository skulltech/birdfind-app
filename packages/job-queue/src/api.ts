import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import * as dotenv from "dotenv";
import { Queue } from "bullmq";
import { UpdateFollowersInput } from "./worker";
dotenv.config();

const server: FastifyInstance = Fastify({});

interface CommonQueryString {
  key: string;
}

interface UpdateFollowersQueryString extends CommonQueryString {
  userId: BigInt;
}

const updateFollowersOpts: RouteShorthandOptions = {
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

server.get<{ Querystring: UpdateFollowersQueryString }>(
  "/updateFollowers",
  updateFollowersOpts,
  async (request, reply) => {
    if (request.query.key != process.env.API_KEY) {
      reply.code(401);
      return { message: "Not authenticated" };
    }

    const updateFollowersQueue = new Queue<UpdateFollowersInput>(
      "updateFollowers"
    );
    await updateFollowersQueue.add(request.query.userId.toString(), {
      userId: request.query.userId,
    });
    return { message: "Successfully added job to queue" };
  }
);

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    const address = server.server.address();
    console.log(`Server listening at ${address}`);

    const port = typeof address === "string" ? address : address?.port;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
