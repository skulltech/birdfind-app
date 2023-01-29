import { Button, Kbd, Stack, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { useEffect, useState } from "react";

type SearchTextInputProps = {
  onSubmit: (arg: string) => void;
};

export const SearchTextInput = ({ onSubmit }: SearchTextInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.length > 0) onSubmit(input);
  };

  return (
    <Stack spacing="sm">
      <Text size="sm">Show accounts where the bio contains a keyword</Text>
      <TextInput
        placeholder="Enter a keyword"
        value={input}
        onChange={(event) => setInput(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
        rightSectionWidth={60}
      />
      <Button>Add filter</Button>
    </Stack>
  );
};
