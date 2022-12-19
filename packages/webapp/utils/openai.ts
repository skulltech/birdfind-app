import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const getPrompt = (username: string, input: string) => `
// Language: JSON

// JSON schema which describes filters
{
    "title": "Filters",
    "type": "object",
    "properties": {
        "followedBy": {
        "type": "array",
        "items": {"type": "string"}
        },
        "followerOf": {
        "type": "array",
        "items": {"type": "string"}
        },
        "followersCountLessThan": {"type": "number"},
        "followersCountGreaterThan": {"type": "number"},
        "followingCountLessThan": {"type": "number"},
        "followingCountGreaterThan": {"type": "number"},
        "tweetCountLessThan": {"type": "number"},
        "tweetCountGreaterThan": {"type": "number"},
        "followerCountLessThan": {"type": "number"},
        "createdBefore": {"type": "string", "format": "date"},
        "createdAfter": {"type": "string", "format": "date"},
        "searchText": {"type": "string"}
},
        "additionalProperties": false
}
// end object

// JSON object of schema Filters for: follow summitkg and simranster, followed by simranster, and have at least 30 tweets
{
    "followedBy": ["simranster"],
    "followerOf": ["summitkg", "simranster"],
    "tweetCountGreaterThan": 30
}
// end object

// JSON object of schema Filters for: followed by ghuubear, follower of simranster, and have less than 100 followers
{
    "followedBy": ["ghuubear"],
    "followerOf": ["simranster"],
    "followersCountLessThan": 100
}
// end object

// JSON object of schema Filters for: follower of indiesumit, created after 2016
{
    "followerOf": ["indiesumit"],
    "createdAfter": "2016-01-01"
}
// end object

// JSON object of schema Filters for: followed by elonmusk, account created before 2012
{
    "followedBy": ["elonmusk"],
    "createdBefore": "2012-01-01"
}
// end object

// JSON object of schema Filters for: followed by me and follower of MangoZeus and account created after march 2018
{
    "followedBy": ["${username}"],
    "followerOf": ["MangoZeus"],
    "createdAfter": "2018-03-01"
}
// end object

// JSON object of schema Filters for: ${input}
`;

export const getFiltersFromPrompt = async (username: string, input: string) => {
  const prompt = getPrompt(username, input);
  const response = await openai.createCompletion({
    model: "code-davinci-002",
    prompt,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["// end object"],
  });
  const responseText = response.data.choices[0].text;

  return JSON.parse(responseText);
};
