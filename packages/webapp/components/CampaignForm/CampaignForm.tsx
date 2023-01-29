import {
  Button,
  Divider,
  Group,
  Space,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useUser } from "../../providers/UserProvider";
import { Chip } from "../Chip";
import { Entity, EntityInput } from "./EntityInput";
import { KeywordInput } from "./KeywordInput";

export const CampaignForm = () => {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const router = useRouter();

  // Campaign inputs
  const [keywords, setKeywords] = useState<string[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [name, setName] = useState<string>("");

  // Loader on submit
  const [loading, setLoading] = useState(false);

  const handleCreateCampaign = async () => {
    setLoading(true);

    try {
      // Create campaign
      const { data } = await supabase
        .from("campaign")
        .insert({
          keywords: keywords,
          user_id: user.id,
          name,
        })
        .select("id")
        .throwOnError()
        .single();
      await supabase
        .from("campaign_entity")
        .insert(
          entities.map((x) => ({ campaign_id: data.id, entity_id: x.id }))
        )
        .throwOnError();

      // Redirect to campaign page
      await router.push(`/campaigns/${data.id}`);
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
          <Group>
            {keywords.map((keyword) => (
              <Chip
                label={`Keyword: "${keyword}"`}
                key={keyword}
                onClose={() =>
                  setKeywords(keywords.filter((x) => x !== keyword))
                }
              />
            ))}
            {entities.map((entity) => (
              <Chip
                label={"Niche: " + entity.name}
                key={entity.id.toString()}
                onClose={() =>
                  setEntities(entities.filter((x) => x.id !== entity.id))
                }
              />
            ))}
          </Group>
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
        onClick={handleCreateCampaign}
        loading={loading}
      >
        Create campaign
      </Button>
    </Stack>
  );
};
