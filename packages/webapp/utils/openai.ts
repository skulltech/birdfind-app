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

// JSON object of schema Filters for: follow summitkg and simranster, followed by simranster, and have at least 30 tweets
{
    "followedBy": ["simranster"],
    "followerOf": ["summitkg", "simranster"],
    "tweetCountGreaterThan": 30
}
// end object

// JSON object of schema Filters for: followed by ghuubear, follower of MangoZeus, and have less than 100 followers
{
    "followedBy": ["ghuubear"],
    "followerOf": ["simranster"],
    "followersCountLessThan": 100
}
// end object

// JSON object of schema Filters for: created after 2016
{
    "createdAfter": "2016-01-01"
}
// end object

// JSON object of schema Filters for: followed by elonmusk, account created before 2012 october 3rd
{
    "followedBy": ["elonmusk"],
    "createdBefore": "2012-10-03"
}
// end object

// JSON object of schema Filters for: followed by me and follower of philomathamit and account created after march 2018
{
    "followedBy": ["${username}"],
    "followerOf": ["MangoZeus"],
    "createdAfter": "2018-03-01"
}
// end object

// JSON object of schema Filters for: my follower who follows more than 1000 people
{
    "followerOf": ["${username}"],
    "followingCountGreaterThan": 1000
}
// end object

// JSON object of schema Filters for: my mutuals with less than 10 tweets
{
    "followerOf": ["${username}"],
    "followedBy": ["${username}"],
    "tweetCountLessThan": 10
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
