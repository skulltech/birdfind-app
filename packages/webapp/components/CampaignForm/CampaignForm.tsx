import { Button, Group, Stack } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useUser } from "../../providers/UserProvider";
import { Chip } from "../FilterPanel/Chips/Chip";
import { Entity, EntityInput } from "./EntityInput";
import { KeywordInput } from "./KeywordInput";

export const CampaignForm = () => {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  // Campaign inputs
  const [keywords, setKeywords] = useState<string[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Loader on submit
  const [loading, setLoading] = useState(false);

  const handleCreateCampaign = async () => {
    setLoading(true);

    try {
      const { data } = await supabase
        .from("user_campaigns")
        .insert({
          keywords: keywords,
          user_id: user.id,
          entities: entities.map((x) => x.id),
        })
        .select("id")
        .single();

      // Reset form
      setKeywords([]);
      setEntities([]);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  return (
    <Stack align="stretch" mx="auto" spacing="sm" p="md" w={400}>
      <Group>
        {keywords.map((keyword) => (
          <Chip
            label={"Keyword: " + keyword}
            key={keyword}
            onClose={() => setKeywords(keywords.filter((x) => x !== keyword))}
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
      <Button
        disabled={keywords.length == 0 && entities.length == 0}
        onClick={handleCreateCampaign}
        loading={loading}
      >
        Create campaign
      </Button>
    </Stack>
  );
};
