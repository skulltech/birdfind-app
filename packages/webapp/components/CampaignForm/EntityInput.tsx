import {
  Button,
  Group,
  Loader,
  Select,
  SelectItem,
  Stack,
} from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconAsteriskSimple } from "@tabler/icons";
import { useEffect, useState } from "react";
import { Entity } from "../../utils/campaigns";

type EntityInputProps = {
  onSubmit: (entity: Entity) => void;
};

export const EntityInput = ({ onSubmit }: EntityInputProps) => {
  const supabase = useSupabaseClient();

  // Domain
  const [domainId, setDomainId] = useState<string>(null);
  const [domainOptions, setDomainOptions] = useState<SelectItem[]>([]);

  // Entity
  const [entityId, setEntityId] = useState<string>(null);
  const [entityOptions, setEntityOptions] = useState<SelectItem[]>([]);
  const [entitySearchValue, setEntitySearchValue] = useState("");
  const [entityLoading, setEntityLoading] = useState(false);

  // Get entity options from Supabase
  const getEntityOptions = async () => {
    setEntityLoading(true);

    try {
      const { data } = await supabase
        .rpc("get_entities", {
          domain_id: domainId,
          search: entitySearchValue,
        })
        .select("id::text,name")
        .limit(30)
        .throwOnError();

      setEntityOptions(data.map((x: any) => ({ value: x.id, label: x.name })));
    } catch (error) {
      console.log(error);
      setEntityOptions([]);
    }

    setEntityLoading(false);
  };

  // Get entity options on search value change
  useEffect(() => {
    getEntityOptions();
  }, [entitySearchValue]);

  // On domain change, reset entity select
  useEffect(() => {
    setEntityId(null);
    setEntitySearchValue("");
    getEntityOptions();
  }, [domainId]);

  // Submit entity
  const handleSubmit = async () => {
    const { data } = await supabase
      .from("entity")
      .select("name")
      .eq("id", entityId)
      .throwOnError()
      .single();

    onSubmit({ name: data.name, id: BigInt(entityId) });
    setEntityId(null);
    setDomainId(null);
    setEntitySearchValue("");
  };

  // Get domain select options from Supabase on first load
  useEffect(() => {
    const getDomainOptions = async () => {
      try {
        const { data } = await supabase
          .rpc("get_domains")
          .select("id::text,name,description")
          .throwOnError();

        setDomainOptions(
          data.map((x: any) => ({
            value: x.id,
            label: x.name,
            description: x.description,
          }))
        );
      } catch (error) {
        console.log(error);
        setDomainOptions([]);
      }
    };

    getDomainOptions();
  }, []);

  return (
    <Stack>
      <Group grow>
        <Select
          label="Select a domain"
          clearable
          description="Domains are broad categories of content. Start typing to search. Leave it blank to search niches across all domains."
          placeholder="All domains"
          data={domainOptions}
          icon={<IconAsteriskSimple size={14} />}
          value={domainId}
          onChange={setDomainId}
          searchable
          nothingFound="No options"
        />
        <Select
          label="Select a niche"
          description="There are many niches within each domain. Start typing to search."
          placeholder="Select a niche"
          data={entityOptions}
          rightSection={entityLoading && <Loader size={16} />}
          icon={<IconAsteriskSimple size={14} />}
          value={entityId}
          onChange={setEntityId}
          searchable
          nothingFound="No options"
          onSearchChange={setEntitySearchValue}
          searchValue={entitySearchValue}
        />
      </Group>
      <Button
        variant="light"
        onClick={handleSubmit}
        disabled={entityId === null}
      >
        Add niche
      </Button>
    </Stack>
  );
};
