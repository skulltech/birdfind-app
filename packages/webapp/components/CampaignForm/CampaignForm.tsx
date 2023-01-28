import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useUser } from "../../providers/UserProvider";
import { Chip } from "../Chip";
import { Domain, DomainInput } from "./DomainInput";
import { Entity, EntityInput } from "./EntityInput";
import { KeywordInput } from "./KeywordInput";

export const CampaignForm = () => {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  // Campaign inputs
  const [keywords, setKeywords] = useState<string[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
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
      await supabase
        .from("campaign_domain")
        .insert(domains.map((x) => ({ campaign_id: data.id, domain_id: x.id })))
        .throwOnError();

      // Reset form
      setKeywords([]);
      setEntities([]);
      setDomains([]);
      setName("");
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  return (
    <Stack align="stretch" spacing="sm">
      <TextInput
        label="Name"
        description="Give your campaign a name"
        // placeholder="Campaign Name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />

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
        {domains.map((domain) => (
          <Chip
            label={"Domain: " + domain.name}
            key={domain.id.toString()}
            onClose={() =>
              setDomains(domains.filter((x) => x.id !== domain.id))
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
      <DomainInput
        onSubmit={(domain) => {
          if (!domains.map((x) => x.id).includes(domain.id))
            setDomains([...domains, domain]);
        }}
      />

      <Button
        disabled={
          keywords.length == 0 && entities.length == 0 && domains.length == 0
        }
        onClick={handleCreateCampaign}
        loading={loading}
      >
        Create campaign
      </Button>
    </Stack>
  );
};
