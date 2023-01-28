import { ActionIcon, Group, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { IconAsteriskSimple, IconChevronRight } from "@tabler/icons";
import { useState } from "react";

type KeywordInputProps = {
  onSubmit: (keyword: string) => void;
};

export const KeywordInput = ({ onSubmit }: KeywordInputProps) => {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = async () => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (normalizedKeyword.length > 0) onSubmit(normalizedKeyword);
    setKeyword("");
  };

  return (
    <Group align="flex-end">
      <TextInput
        label="Keyword"
        description="Search for a keyword"
        style={{ flex: 1 }}
        placeholder="Enter a keyword"
        icon={<IconAsteriskSimple size={14} />}
        value={keyword}
        onChange={(event) => setKeyword(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
      />
      <ActionIcon
        mb={1.5}
        variant="default"
        size="lg"
        onClick={handleSubmit}
        color="blue"
        disabled={keyword.length === 0}
      >
        <IconChevronRight />
      </ActionIcon>
    </Group>
  );
};
