import { campaignColumns } from "@birdfind/common";
import { SupabaseClient } from "@supabase/supabase-js";

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
