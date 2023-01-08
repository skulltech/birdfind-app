import { auth } from "twitter-api-sdk";

export type GetTwitterAuthClientArgs = {
  clientId: string;
  clientSecret: string;
  oauthToken?: auth.OAuth2UserOptions["token"];
  origin: string;
};

export const getTwitterAuthClient = ({
  clientId,
  clientSecret,
  oauthToken,
  origin,
}: GetTwitterAuthClientArgs) =>
  new auth.OAuth2User({
    client_id: clientId,
    client_secret: clientSecret,
    callback: new URL("/api/auth/twitter/callback", origin).toString(),
    scopes: [
      "tweet.read",
      "tweet.write",
      "tweet.moderate.write",
      "users.read",
      "follows.read",
      "follows.write",
      "offline.access",
      "space.read",
      "mute.read",
      "mute.write",
      "like.read",
      "like.write",
      "list.read",
      "list.write",
      "block.read",
      "block.write",
      "bookmark.read",
      "bookmark.write",
    ],
    token: oauthToken,
  });
