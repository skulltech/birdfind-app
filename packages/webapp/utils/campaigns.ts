import { campaignColumns } from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

type GetCampaignCountsArgs = {
  campaignId: string;
  supabase: SupabaseClient;
};

type GetCampaignCountsResult = {
  tweetCount: number;
  profileCount: number;
};

const getCampaignCounts = async ({
  campaignId,
  supabase,
}: GetCampaignCountsArgs): Promise<GetCampaignCountsResult> => {
  // Get count
  const { data } = await supabase
    .rpc("get_campaign_counts", { campaign_id: campaignId })
    .select("tweet_count,profile_count")
    .throwOnError()
    .single();
  return { tweetCount: data.tweet_count, profileCount: data.profile_count };
};

export type Entity = {
  name: string;
  id: bigint;
  isPositive: boolean;
};

export type Keyword = {
  keyword: string;
  isPositive: boolean;
};

export type Campaign = {
  id: number;
  name: string;
  keywords: Keyword[];
  entities: Entity[];
  paused: boolean;
  profileCount: number;
  tweetCount: number;
};

type GetAllCampaignsArgs = {
  supabase: SupabaseClient;
};

export const getAllCampaigns = async ({
  supabase,
}: GetAllCampaignsArgs): Promise<Campaign[]> => {
  const campaigns: Campaign[] = [];

  const { data } = await supabase
    .from("campaign")
    .select(campaignColumns)
    .eq("deleted", false)
    .throwOnError();

  for (const campaign of data) {
    // Get all entities
    const { data: campaignEntities } = await supabase
      .from("campaign_entity")
      .select("entity_id::text,is_positive")
      .eq("campaign_id", campaign.id)
      .throwOnError();
    const { data: entityInfos } = await supabase
      .from("entity")
      .select("id::text,name")
      .in(
        "id",
        // @ts-ignore
        campaignEntities.map((x) => x.entity_id)
      )
      .throwOnError();
    const entities = entityInfos.map((entityInfo, i) => ({
      // @ts-ignore
      ...entityInfo,
      // @ts-ignore
      isPositive: campaignEntities[i].is_positive,
    }));

    // Get all keywords
    const { data: keywords } = await supabase
      .from("campaign_keyword")
      .select("keyword,is_positive")
      .eq("campaign_id", campaign.id)
      .throwOnError();

    // Get campaign counts
    const { profileCount, tweetCount } = await getCampaignCounts({
      supabase,
      campaignId: campaign.id,
    });

    // Add to campaigns
    campaigns.push({
      ...campaign,
      entities,
      keywords: keywords.map((x) => ({
        isPositive: x.is_positive,
        keyword: x.keyword,
      })),
      profileCount,
      tweetCount,
    });
  }

  return campaigns;
};

type GetCampaignArgs = {
  supabase: SupabaseClient;
  id: bigint;
};

export const getCampaign = async ({
  id,
  supabase,
}: GetCampaignArgs): Promise<Campaign> => {
  const { data: campaign } = await supabase
    .from("campaign")
    .select(campaignColumns)
    .eq("id", id)
    .throwOnError()
    .maybeSingle();

  // Get all entities
  const { data: campaignEntities } = await supabase
    .from("campaign_entity")
    .select("entity_id::text,is_positive")
    .eq("campaign_id", campaign.id)
    .throwOnError();
  const { data: entityInfos } = await supabase
    .from("entity")
    .select("id::text,name")
    .in(
      "id",
      // @ts-ignore
      campaignEntities.map((x) => x.entity_id)
    )
    .throwOnError();
  const entities = entityInfos.map((entityInfo, i) => ({
    // @ts-ignore
    ...entityInfo,
    // @ts-ignore
    isPositive: campaignEntities[i].is_positive,
  }));

  // Get all keywords
  const { data: keywords } = await supabase
    .from("campaign_keyword")
    .select("keyword,is_positive")
    .eq("campaign_id", campaign.id)
    .throwOnError();

  // Get campaign counts
  const { profileCount, tweetCount } = await getCampaignCounts({
    supabase,
    campaignId: campaign.id,
  });

  return {
    ...campaign,
    keywords: keywords.map((x) => ({
      isPositive: x.is_positive,
      keyword: x.keyword,
    })),
    entities,
    profileCount,
    tweetCount,
  };
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const createEmbedding = async (input: string) => {
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });
  return response.data.data[0].embedding;
};

type UpdateCampaignEmbeddingArgs = {
  id: number;
  supabase: SupabaseClient;
};

export const updateCampaignEmbeddings = async ({
  id,
  supabase,
}: UpdateCampaignEmbeddingArgs) => {
  const { data: campaign } = await supabase
    .from("campaign")
    .select(campaignColumns)
    .eq("id", id)
    .throwOnError()
    .maybeSingle();

  // Get all entities
  const { data: campaignEntities } = await supabase
    .from("campaign_entity")
    .select("entity_id::text,is_positive")
    .eq("campaign_id", campaign.id)
    .throwOnError();
  const { data: entityInfos } = await supabase
    .from("entity")
    .select("id::text,name")
    .in(
      "id",
      // @ts-ignore
      campaignEntities.map((x) => x.entity_id)
    )
    .throwOnError();
  const entities = entityInfos.map((entityInfo, i) => ({
    // @ts-ignore
    ...entityInfo,
    // @ts-ignore
    is_positive: campaignEntities[i].is_positive,
  }));

  // Get all keywords
  const { data: keywords } = await supabase
    .from("campaign_keyword")
    .select("keyword,is_positive")
    .eq("campaign_id", campaign.id)
    .throwOnError();

  // Create positive and negative embeddings
  const positiveEmbedding = await createEmbedding(
    [
      ...entities.filter((x) => x.is_positive).map((x) => x.name),
      ...keywords.filter((x) => x.is_positive).map((x) => x.keyword),
    ].join("\n")
  );
  const negativeEmbedding = await createEmbedding(
    [
      ...entities.filter((x) => !x.is_positive).map((x) => x.name),
      ...keywords.filter((x) => !x.is_positive).map((x) => x.keyword),
    ].join("\n")
  );

  // Insert embeddings into database
  await supabase
    .from("campaign")
    .update({
      positive_embedding: positiveEmbedding,
      negative_embedding: negativeEmbedding,
    })
    .eq("id", campaign.id)
    .throwOnError();
};
