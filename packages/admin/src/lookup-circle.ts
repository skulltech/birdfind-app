import { serializeTwitterUser, twitterUserFields } from "@birdfind/common";
import { supabase, twitter } from "./utils";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getPrompt = (description: string, tweets: string[]) => `
Following is the bio of a Twitter user:

${description}

Following are their recent top performing 50 tweets:

${tweets.join("\n")}

Following are the top 10 niches they talk about, separated by newline without any bullet points:
`;

export const getNiches = async (description: string, tweets: string[]) => {
  const prompt = getPrompt(description, tweets);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    // model: "text-curie-001",
    prompt,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const responseText = response.data.choices[0].text;
  return responseText.split("\n").filter((x) => x.length != 0);
};

const userId = "20c6787f-9a00-4dcb-a2a8-7c4a0f87c8d0";

export const createLookupCircleJob = async (username: string) => {
  // Get seed user details and insert profile
  const { data: user } = await twitter.users.findUserByUsername(username, {
    "user.fields": twitterUserFields,
  });
  await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .throwOnError();

  // Insert job
  await supabase
    .from("lookup_circle_job")
    .insert({ user_id: userId, target_id: user.id, member_ids: [user.id] })
    .throwOnError();
};

export const getLookupCircleResult = async (jobId: number) => {
  const { data: jobData } = await supabase
    .from("lookup_circle_job")
    .select("member_ids::_text")
    .eq("id", jobId)
    .throwOnError()
    .single();
};

export const iterateLookupCircleJob = async (jobId: number) => {
  const { data: jobData } = await supabase
    .from("lookup_circle_job")
    .select("member_ids::_text")
    .eq("id", jobId)
    .throwOnError()
    .single();
  // @ts-ignore
  const memberIds: string[] = jobData.member_ids;

  const { data: members } = await supabase
    .rpc("get_circle", { id: jobId })
    .select("id::text,followers_count,edge_count")
    .throwOnError();

  console.log(members.length);

  // Get at most 10 members for one iteration
  const x = 10;
  const selectedMembers = members.slice(
    members.length / 2 - x / 2,
    members.length / 2 + x / 2
  );

  console.log("selectedMembers", selectedMembers, selectedMembers.length);
  //   return;

  let allFetchComplete = true;

  for (const member of selectedMembers) {
    // @ts-ignore
    if (Date.parse(member.following_updated_at) == 0) {
      await supabase
        .from("lookup_relation_job")
        .insert({
          user_id: userId,
          // @ts-ignore
          target_id: member.id,
          relation: "following",
          priority: 20000,
        })
        .throwOnError();
      // @ts-ignore
      console.log("added job for", member.username);
      allFetchComplete = false;
    }
    // @ts-ignore
    else console.log("don't need to add job for", member.username);
  }

  if (allFetchComplete) {
    console.log(
      "fetched following of selected list members, can proceed to next stage"
    );

    const { data: followingOfMembers } = await supabase
      .from("twitter_follow")
      .select("target_id")
      .in(
        "source_id",
        selectedMembers.map((x: any) => x.id)
      )
      .throwOnError();
    console.log(followingOfMembers.length);
    const nextIds = new Set<string>();

    followingOfMembers.forEach((x: any) => nextIds.add(x.target_id));
    memberIds.forEach((x) => nextIds.add(x));
    const newMemberIds = Array.from(nextIds);
    // console.log(newMemberIds);

    await supabase
      .from("lookup_circle_job")
      .update({ member_ids: newMemberIds })
      .eq("id", jobId)
      .throwOnError()
      .single();
  }
};

export const createEmbedding = async (input: string) => {
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });
  return response.data.data[0].embedding;
};

export const analyzeUser = async (username: string) => {
  // Get seed user details and insert profile
  const { data: user } = await twitter.users.findUserByUsername(username, {
    "user.fields": twitterUserFields,
  });
  const { data } = await supabase
    .from("twitter_profile")
    .upsert(serializeTwitterUser(user))
    .select("niches,niches_embedding")
    .throwOnError()
    .single();
  console.log("Got details of user from Twitter API", username);

  // Get niches if not available
  if (!data.niches || !data.niches_embedding) {
    console.log("Niche details not available, fetching", username);

    const tweets = [];

    // Get at most 300 most recent tweets
    let paginationToken: string;
    for (const i of Array(3)) {
      const { data, meta } = await twitter.tweets.usersIdTweets(user.id, {
        max_results: 100,
        exclude: ["replies", "retweets"],
        "tweet.fields": ["public_metrics"],
        pagination_token: paginationToken,
      });
      tweets.push(...data);
      paginationToken = meta.next_token;
    }

    // Sort the tweets by no. of likes and get the top 50
    const sortedTweets = tweets.sort(
      (a, b) => b.public_metrics.like_count - a.public_metrics.like_count
    );
    const inputTweeets = sortedTweets
      .slice(0, 50)
      .map((x) => x.text.replaceAll("\n", " "));

    // Get list of niches
    const niches = await getNiches(user.description, inputTweeets);
    // Get embedding vector from niches
    const embedding = await createEmbedding(niches.join(", "));

    await supabase
      .from("twitter_profile")
      .update({ niches, niches_embedding: embedding })
      .eq("username", username);
  }

  console.log("Niche details are fetched", username);

  const { data: baseUser } = await supabase
    .from("twitter_profile")
    .select("niches,niches_embedding")
    .eq("username", username)
    .throwOnError()
    .single();

  const { data: following } = await supabase
    .from("twitter_follow")
    .select("target_id")
    .eq("source_id", user.id)
    .throwOnError();

  //   console.log("Now processing his following", following.length);

  const result = [];

  for (const userId of following.map((x) => x.target_id)) {
    try {
      const { data: targetUser } = await supabase
        .from("twitter_profile")
        .select("username,niches_embedding")
        .eq("id", userId)
        .throwOnError()
        .single();

      if (targetUser.niches_embedding) {
        const item = {
          username: targetUser.username,
          similarity: dot(
            baseUser.niches_embedding,
            targetUser.niches_embedding
          ),
        };
        console.log(targetUser.username);
        result.push(item);
      }
      //   else {
      //     console.log(
      //       "Niche details are not availabel for following, fetching",
      //       targetUser.username
      //     );

      //     const tweets = [];

      //     // Get at most 300 most recent tweets
      //     let paginationToken: string;
      //     for (const i of Array(3)) {
      //       const { data, meta } = await twitter.tweets.usersIdTweets(userId, {
      //         max_results: 100,
      //         exclude: ["replies", "retweets"],
      //         "tweet.fields": ["public_metrics"],
      //         pagination_token: paginationToken,
      //       });
      //       tweets.push(...data);
      //       paginationToken = meta.next_token;
      //     }

      //     // Sort the tweets by no. of likes and get the top 50
      //     const sortedTweets = tweets.sort(
      //       (a, b) => b.public_metrics.like_count - a.public_metrics.like_count
      //     );
      //     const inputTweeets = sortedTweets
      //       .slice(0, 50)
      //       .map((x) => x.text.replaceAll("\n", " "));

      //     // Get list of niches
      //     // const niches = await getNiches(user.description, inputTweeets);
      //     // Get embedding vector from niches
      //     const embedding = await createEmbedding(
      //       [user.description, ...inputTweeets].join("\n")
      //     );

      //     await supabase
      //       .from("twitter_profile")
      //       .update({ niches_embedding: embedding })
      //       .eq("id", userId);

      //     console.log(
      //       "Fetched niched details for  following",
      //       targetUser.username
      //     );
      //   }
    } catch (error) {}
  }

  console.log(
    result.sort((a, b) => b.similarity - a.similarity),
    result.length
  );
};

const dot = (a: number[], b: number[]) => {
  let res = 0;
  for (const [i, ai] of a.entries()) {
    res = res + ai * b[i];
  }
  return res;
};
