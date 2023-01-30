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
};

export type Campaign = {
  id: number;
  name: string;
  keywords: string[];
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
    const { data: entityIds } = await supabase
      .from("campaign_entity")
      .select("entity_id::text")
      .eq("campaign_id", campaign.id)
      .throwOnError();
    const { data: entities } = await supabase
      .from("entity")
      .select("id::text,name")
      .in(
        "id",
        // @ts-ignore
        entityIds.map((x) => x.entity_id)
      )
      .throwOnError();
    const { profileCount, tweetCount } = await getCampaignCounts({
      supabase,
      campaignId: campaign.id,
    });
    campaigns.push({
      ...campaign,
      // @ts-ignore
      entities,
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

  const { data: entityIds } = await supabase
    .from("campaign_entity")
    .select("entity_id::text")
    .eq("campaign_id", campaign.id)
    .throwOnError();
  const { data: entities } = await supabase
    .from("entity")
    .select("id::text,name")
    .in(
      "id",
      // @ts-ignore
      entityIds.map((x) => x.entity_id)
    )
    .throwOnError();
  const { profileCount, tweetCount } = await getCampaignCounts({
    supabase,
    campaignId: campaign.id,
  });

  return {
    ...campaign,
    // @ts-ignore
    entities,
    profileCount,
    tweetCount,
  };
};
