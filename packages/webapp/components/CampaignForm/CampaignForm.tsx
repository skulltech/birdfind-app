import { Button, Space, Stack, Text, TextInput } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useUser } from "../../providers/UserProvider";
import { Campaign, Entity, Keyword } from "../../utils/campaigns";
import { EntityInput } from "./EntityInput";
import { KeywordInput } from "./KeywordInput";
import { ParamChipGroup } from "./ParamChipGroup";

type CampaignFormProps = {
  campaign?: Campaign;
  onSubmit?: () => void;
};

export const CampaignForm = ({ campaign, onSubmit }: CampaignFormProps) => {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const router = useRouter();

  // Campaign inputs
  const [keywords, setKeywords] = useState<Keyword[]>(campaign?.keywords || []);
  const [entities, setEntities] = useState<Entity[]>(campaign?.entities || []);
  const [name, setName] = useState<string>(campaign?.name || "");

  // Loader on submit
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (!campaign) {
        // Create campaign
        const { data } = await supabase
          .from("campaign")
          .insert({
            user_id: user.id,
            name,
          })
          .select("id")
          .throwOnError()
          .single();
        await supabase
          .from("campaign_entity")
          .insert(
            entities.map((x) => ({
              campaign_id: data.id,
              entity_id: x.id,
              is_positive: x.isPositive,
            }))
          )
          .throwOnError();
        await supabase
          .from("campaign_keyword")
          .insert(
            keywords.map((x) => ({
              campaign_id: data.id,
              keyword: x.keyword,
              is_positive: x.isPositive,
            }))
          )
          .throwOnError();

        if (onSubmit) onSubmit();
        // Redirect to campaign page
        await router.push(`/campaigns/${data.id}`);
      } else {
        // Update campaign
        await supabase
          .from("campaign")
          .update({
            name,
            // Reset progress, TODO: do this only if keywords or entities changed
            pagination_token: null,
            pagination_started_at: null,
            latest_tweet_id: null,
            last_run_at: null,
          })
          .eq("id", campaign.id)
          .throwOnError();

        // Delete and re-insert entities
        await supabase
          .from("campaign_entity")
          .delete()
          .eq("campaign_id", campaign.id)
          .throwOnError();
        await supabase
          .from("campaign_entity")
          .insert(
            entities.map((x) => ({
              campaign_id: campaign.id,
              entity_id: x.id,
              is_positive: x.isPositive,
            }))
          )
          .throwOnError();

        // Delete and re-insert keywords
        await supabase
          .from("campaign_keyword")
          .delete()
          .eq("campaign_id", campaign.id)
          .throwOnError();
        await supabase
          .from("campaign_keyword")
          .insert(
            keywords.map((x) => ({
              campaign_id: campaign.id,
              keyword: x.keyword,
              is_positive: x.isPositive,
            }))
          )
          .throwOnError();

        if (onSubmit) onSubmit();
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  return (
    <Stack align="stretch" spacing="sm">
      <TextInput
        withAsterisk
        label="Name"
        name="campaign-name"
        description="Give your campaign a name"
        value={name}
        error={name == "" ? "This is a required field" : null}
        onChange={(e) => setName(e.currentTarget.value)}
      />

      {(keywords.length > 0 || entities.length > 0) && (
        <>
          <Space h="md" />
          <ParamChipGroup
            keywords={keywords}
            entities={entities}
            setKeywords={setKeywords}
            setEntities={setEntities}
          />
        </>
      )}

      <Space h="md" />
      <Text size="sm" style={{ lineHeight: 1.3 }}>
        You can add either niches or keywords to your campaign. You should first
        try to find niches that describe what you want, and use keywords only if
        niches are inadequate. You should add at least one niche or keyword to
        your campaign.
      </Text>
      <EntityInput
        onSubmit={(entity) => {
          if (!entities.map((x) => x.id).includes(entity.id))
            setEntities([...entities, entity]);
        }}
      />
      <KeywordInput
        onSubmit={(keyword) => {
          if (!keywords.includes(keyword)) setKeywords([...keywords, keyword]);
        }}
      />

      <Space h="md" />
      <Button
        disabled={(keywords.length == 0 && entities.length == 0) || name == ""}
        onClick={handleSubmit}
        loading={loading}
      >
        {campaign ? "Update campaign" : "Create campaign"}
      </Button>
    </Stack>
  );
};
