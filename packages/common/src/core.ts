import {
  findUserByUsername,
  TwitterParams,
  TwitterResponse,
} from "twitter-api-sdk/dist/types";

export const twitterUserFields: TwitterParams<findUserByUsername>["user.fields"] =
  [
    "created_at",
    "description",
    "entities",
    "location",
    "pinned_tweet_id",
    "profile_image_url",
    "protected",
    "public_metrics",
    "url",
    "verified",
    "withheld",
  ];

export const twitterProfileColumns = [
  "id::text",
  "created_at",
  "updated_at",
  "followers_updated_at",
  "following_updated_at",
  "muting_updated_at",
  "blocking_updated_at",
  "username",
  "name",
  "user_created_at",
  "description",
  "entities",
  "location",
  "pinned_tweet_id",
  "profile_image_url",
  "protected",
  "followers_count",
  "following_count",
  "tweet_count",
  "listed_count",
  "url",
  "verified",
  "withheld",
];

export const searchTwitterProfilesColumns = [...twitterProfileColumns];

export const serializeTwitterUser = (
  user: TwitterResponse<findUserByUsername>["data"]
) => {
  return {
    id: user.id,
    updated_at: new Date().toISOString(),
    username: user.username,
    name: user.name,
    user_created_at: user.created_at,
    description: user.description,
    entities: user.entities ?? null,
    location: user.location ?? null,
    pinned_tweet_id: user.pinned_tweet_id ?? null,
    profile_image_url: user.profile_image_url,
    protected: user.protected,
    followers_count: user.public_metrics.followers_count,
    following_count: user.public_metrics.following_count,
    tweet_count: user.public_metrics.tweet_count,
    listed_count: user.public_metrics.listed_count,
    url: user.url ?? null,
    verified: user.verified,
    withheld: user.withheld ?? null,
  };
};

export const lookupRelationJobColumns = [
  "id",
  "created_at",
  "updated_at",
  "user_id",
  "relation",
  "target_id::text",
  "priority",
  "finished",
  "pagination_token",
  "updated_count",
  "paused",
];

export const manageListMembersJobColumns = [
  "id",
  "created_at",
  "updated_at",
  "user_id",
  "list_id::text",
  "add",
  "priority",
  "paused",
  "finished",
  "member_ids_done::_text",
  "member_ids::_text",
];

type ConcatStringArray<
  Strings extends readonly string[],
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Head extends string
    ? Rest extends readonly string[]
      ? ConcatStringArray<Rest, `${Acc}${Head}`>
      : Acc
    : Acc
  : Acc;

type Join<
  Strings extends readonly string[],
  Joiner extends string = ",",
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Rest extends readonly string[]
    ? Join<
        Rest,
        Joiner,
        Head extends string
          ? Acc extends ""
            ? Head
            : ConcatStringArray<readonly [Acc, Joiner, Head]>
          : never
      >
    : never
  : Acc;

const join = <StrArr extends readonly string[], Sep extends string = ",">(
  strings: StrArr,
  separator: Sep = "," as Sep
): Join<StrArr, Sep> => {
  return strings.join(separator) as Join<StrArr, Sep>;
};

export const manageRelationJobColumns = join(
  [
    "id",
    "created_at",
    "updated_at",
    "user_id",
    "priority",
    "relation",
    "add",
    "paused",
    "finished",
    "target_ids::_text",
    "target_ids_done::_text",
  ] as const,
  ","
);

export const jobNames = [
  "lookup-relation",
  "manage-relation",
  "manage-list-members",
] as const;

export type JobName = typeof jobNames[number];
