import { twitter } from "./utils";

export const lookupTwitterUser = async (username: string) => {
  const { data: user } = await twitter.users.findUserByUsername(username);
  const {
    data: tweets,
    includes: { users, places },
  } = await twitter.tweets.usersIdTweets(user.id, {
    "tweet.fields": ["context_annotations", "author_id"],
    expansions: ["author_id"],
    "user.fields": ["location", "name", "username", "verified"],
  });
  tweets.forEach((tweet) => {
    console.log(tweet, users, places);
  });
};
