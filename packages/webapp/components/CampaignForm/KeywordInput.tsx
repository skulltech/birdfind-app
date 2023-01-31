import { Button, Chip, Group, Stack, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { IconAsteriskSimple } from "@tabler/icons";
import { useState } from "react";
import { Keyword } from "../../utils/campaigns";

type KeywordInputProps = {
  onSubmit: (keyword: Keyword) => void;
};

export const KeywordInput = ({ onSubmit }: KeywordInputProps) => {
  const [keyword, setKeyword] = useState("");

  // Whether the input is positive or negative
  const [chipValue, setChipValue] = useState<"true" | "false">("true");
  const isPositive = chipValue === "true";

  const handleSubmit = async () => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (normalizedKeyword.length > 0)
      onSubmit({ keyword: normalizedKeyword, isPositive });
    setKeyword("");
    setChipValue("true");
  };

  return (
    <Stack spacing={0}>
      <Text weight={500} size="sm">
        Add a keyword constraint
      </Text>
      <Text size="xs">{`Tweets matching ${
        keyword == "" ? "this keyword" : `keyword "${keyword}"`
      } will ${isPositive ? "be" : "not be"} included in the campaign.`}</Text>
      <Group mt="xs">
        <TextInput
          name="campaign-keyword"
          style={{ flex: 1 }}
          placeholder="Enter a keyword"
          icon={<IconAsteriskSimple size={14} />}
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
          onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
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
          disabled={keyword.length === 0}
        >
          Add constraint
        </Button>
      </Group>
    </Stack>
  );
};
