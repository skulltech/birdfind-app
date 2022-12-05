import NextAuth, { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { getSession } from "next-auth/react";
import { NextApiRequest, NextApiResponse } from "next";
import { oauthAccountExists } from "../../../utils";

const twitterScopes = [
  "users.read",
  "follows.read",
  "follows.write",
  "mute.read",
  "mute.write",
  "block.read",
  "block.write",
];

// Taken from: https://github.com/nextauthjs/next-auth/discussions/3936#discussioncomment-2165109
export function getNextAuthOptions(req?: NextApiRequest): NextAuthOptions {
  return {
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/account/signin",
    },
    providers: [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        version: "2.0",
        authorization: { params: { scope: twitterScopes.join(" ") } },
      }),
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      }),
    ],
    adapter: SupabaseAdapter({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }),
    callbacks: {
      async signIn({ user, account, profile, email, credentials }) {
        console.log({ user, account, profile, email, credentials });
        if (
          account.provider === "twitter" &&
          // User is logged in already and he's linking Twitter to his account
          !(await getSession({ req })) &&
          // He is not logged in but he has already linked Twitter with his account
          !(await oauthAccountExists(account.providerAccountId))
        )
          return false;
        return true;
      },

      async session({ session, token, user }) {
        // @ts-ignore
        session.twitter = token.twitter;
        return session;
      },

      async jwt({ token, account, profile }) {
        // If logging in with Twitter, inject twitter details to JWT
        if (account && account.provider === "twitter") {
          token.twitter = {
            accessToken: account.access_token,
            // @ts-ignore
            profile: profile.data,
          };
        }
        return token;
      },
    },
  };
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, getNextAuthOptions(req));
}
