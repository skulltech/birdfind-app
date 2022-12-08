import NextAuth from "next-auth";
import { TwitterToken } from "../utils/helpers";

declare module "next-auth" {
  interface Session {
    twitter?: TwitterToken;
  }
}
