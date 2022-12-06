import NextAuth from "next-auth";
import { TwitterToken } from "../utils/components";

declare module "next-auth" {
  interface Session {
    twitter?: TwitterToken;
  }
}
