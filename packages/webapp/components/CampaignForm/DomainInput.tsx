import { ActionIcon, Group, Loader, Select, SelectItem } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconAsteriskSimple, IconChevronRight } from "@tabler/icons";
import { useEffect, useState } from "react";

export type Domain = {
  name: string;
  description: string;
  id: bigint;
};

type DomainInputProps = {
  onSubmit: (domain: Domain) => void;
};

export const DomainInput = ({ onSubmit }: DomainInputProps) => {
  const supabase = useSupabaseClient();

  // Select value and options
  const [value, setValue] = useState<string>(null);
  const [selectOptions, setSelectOptions] = useState<SelectItem[]>([]);
  const [selectLoading, setSelectLoading] = useState(false);

  // Get domain select options from Supabase on first load
  useEffect(() => {
    const getSelectOptions = async () => {
      setSelectLoading(true);

      try {
        const { data } = await supabase
          .from("domain")
          .select("id::text,name,description")
          .throwOnError();

        // @ts-ignore
        setSelectOptions(
          data.map((x: any) => ({
            value: x.id,
            label: x.name,
            description: x.description,
          }))
        );
      } catch (error) {
        console.log(error);
        setSelectOptions([]);
      }

      setSelectLoading(false);
    };

    getSelectOptions();
  }, []);

  const handleSubmit = async () => {
    const { data } = await supabase
      .from("domain")
      .select("name,description")
      .eq("id", value)
      .throwOnError()
      .single();

    onSubmit({
      name: data.name,
      id: BigInt(value),
      description: data.description,
    });
    setValue(null);
  };

  return (
    <Group align="flex-end">
      <Select
        label="Domain"
        description="Select a domain for your campaign"
        style={{ flex: 1 }}
        placeholder="Select a domain"
        data={selectOptions}
        rightSection={selectLoading && <Loader size={16} />}
        icon={<IconAsteriskSimple size={14} />}
        value={value}
        onChange={setValue}
        searchable
        nothingFound="No options"
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
