import { twitter } from "./utils";

export const lookupTwitterUser = async (username: string) => {
  const { data: user } = await twitter.users.findUserByUsername(username);
  const { data: tweets } = await twitter.tweets.usersIdTweets(user.id, {
    "tweet.fields": ["context_annotations"],
  });
  tweets.forEach((tweet) => {
    console.log(tweet.text, tweet.context_annotations);
  });
};
