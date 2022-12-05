import NextAuth from "next-auth";
import { TwitterToken } from "../utils";

declare module "next-auth" {
  interface Session {
    twitter?: TwitterToken;
  }
}
