import { Kbd, Stack, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useTwips } from "../../TwipsProvider";

export const SearchTextInput = () => {
  const [searchText, setSearchText] = useState("");
  const { filters, addFilters, removeFilters } = useTwips();

  useEffect(() => {
    if (!filters.searchText) setSearchText("");
  }, [filters.searchText]);

  const handleSubmit = () => {
    if (searchText.length == 0) removeFilters("searchText");
    else addFilters({ searchText });
  };

  return (
    <Stack spacing={2}>
      <Text>Profile contains text</Text>
      <TextInput
        value={searchText}
        onChange={(event) => setSearchText(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
        rightSection={<Kbd>Enter</Kbd>}
        rightSectionWidth={60}
      />
    </Stack>
  );
};
