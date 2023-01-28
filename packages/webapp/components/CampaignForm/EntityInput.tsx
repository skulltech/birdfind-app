import { ActionIcon, Group, Loader, Select, SelectItem } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconAsteriskSimple, IconChevronRight } from "@tabler/icons";
import { useEffect, useState } from "react";

export type Entity = {
  name: string;
  id: bigint;
};

type EntityInputProps = {
  onSubmit: (entity: Entity) => void;
};

export const EntityInput = ({ onSubmit }: EntityInputProps) => {
  const supabase = useSupabaseClient();

  // Select value and options
  const [value, setValue] = useState<string>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectOptions, setSelectOptions] = useState<SelectItem[]>([]);
  const [selectLoading, setSelectLoading] = useState(false);

  // Get entity select options from Supabase
  useEffect(() => {
    const getSelectOptions = async () => {
      setSelectLoading(true);

      try {
        const { data } = await supabase
          .from("entity")
          .select("id::text,name")
          .ilike("name", `%${searchValue}%`)
          .limit(10)
          .throwOnError();

        // @ts-ignore
        setSelectOptions(data.map((x) => ({ value: x.id, label: x.name })));
      } catch (error) {
        console.log(error);
        setSelectOptions([]);
      }

      setSelectLoading(false);
    };

    getSelectOptions();
  }, [searchValue]);

  const handleSubmit = async () => {
    const { data } = await supabase
      .from("entity")
      .select("name")
      .eq("id", value)
      .throwOnError()
      .single();

    onSubmit({ name: data.name, id: BigInt(value) });
    setValue(null);
  };

  return (
    <Group align="flex-end">
      <Select
        label="Niche"
        description="Select a niche for your campaign"
        style={{ flex: 1 }}
        placeholder="Select a niche"
        data={selectOptions}
        rightSection={selectLoading && <Loader size={16} />}
        icon={<IconAsteriskSimple size={14} />}
        value={value}
        onChange={setValue}
        searchable
        nothingFound="No options"
        onSearchChange={setSearchValue}
        searchValue={searchValue}
      />
      <ActionIcon
        mb={1.5}
        variant="default"
        size="lg"
        onClick={handleSubmit}
        color="blue"
        disabled={value === null}
      >
        <IconChevronRight />
      </ActionIcon>
    </Group>
  );
};
