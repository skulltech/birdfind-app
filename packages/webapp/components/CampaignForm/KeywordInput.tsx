import { Button, Group, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { IconAsteriskSimple } from "@tabler/icons";
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
        name="campaign-keyword"
        label="Keyword"
        description="Users who posted tweets matching this keyword will be included in the campaign."
        style={{ flex: 1 }}
        placeholder="Enter a keyword"
        icon={<IconAsteriskSimple size={14} />}
        value={keyword}
        onChange={(event) => setKeyword(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
      />
      <Button
        variant="light"
        onClick={handleSubmit}
        disabled={keyword.length === 0}
      >
        Add keyword
      </Button>
    </Group>
  );
};
