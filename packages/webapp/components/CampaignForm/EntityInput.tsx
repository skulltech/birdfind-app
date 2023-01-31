import {
  Button,
  Chip,
  Group,
  Loader,
  Select,
  SelectItem,
  Stack,
  Text,
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

  // Entity
  const [entityId, setEntityId] = useState<string>(null);
  const [entityOptions, setEntityOptions] = useState<SelectItem[]>([]);
  const [entitySearchValue, setEntitySearchValue] = useState("");
  const [entityLoading, setEntityLoading] = useState(false);

  // Whether the input is positive or negative
  const [chipValue, setChipValue] = useState<"true" | "false">("true");
  const isPositive = chipValue === "true";

  // Get entity options from Supabase
  const getEntityOptions = async () => {
    setEntityLoading(true);

    try {
      const { data } = await supabase
        .rpc("get_entities", { search: entitySearchValue })
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

  // Submit entity
  const handleSubmit = async () => {
    if (entityId === null) {
      return;
    }

    const { data } = await supabase
      .from("entity")
      .select("name")
      .eq("id", entityId)
      .throwOnError()
      .single();

    onSubmit({ name: data.name, id: BigInt(entityId), isPositive });
    setEntityId(null);
    setEntitySearchValue("");
    setChipValue("true");
  };

  return (
    <Stack spacing={0}>
      <Text weight={500} size="sm">
        Add a niche constraint
      </Text>
      <Text size="xs">{`Tweets matching ${
        entityId == null ? "this niche" : `the niche "${entitySearchValue}"`
      } will ${isPositive ? "be" : "not be"} included in the campaign.`}</Text>
      <Group mt="xs">
        <Select
          clearable
          style={{ flex: 1 }}
          placeholder="Select a niche"
          data={entityOptions}
          rightSection={entityLoading && <Loader size={16} />}
          icon={<IconAsteriskSimple size={14} />}
          value={entityId}
          onChange={setEntityId}
          searchable
          nothingFound="Nothing found"
          onSearchChange={setEntitySearchValue}
          searchValue={entitySearchValue}
        />
        <Chip.Group
          multiple={false}
          value={chipValue}
          // @ts-ignore
          onChange={setChipValue}
        >
          <Chip value="true">Include</Chip>
          <Chip value="false">Do not include</Chip>
        </Chip.Group>
        <Button
          variant="light"
          onClick={handleSubmit}
          disabled={entityId === null}
        >
          Add constraint
        </Button>
      </Group>
    </Stack>
  );
};
