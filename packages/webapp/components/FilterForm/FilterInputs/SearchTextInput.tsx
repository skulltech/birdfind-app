import { Button, Stack, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { useState } from "react";

type SearchTextInputProps = {
  onSubmit: (arg: string) => Promise<void>;
};

export const SearchTextInput = ({ onSubmit }: SearchTextInputProps) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (input.length > 0) {
      setLoading(true);
      try {
        await onSubmit(input);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
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
      <Button onClick={handleSubmit} loading={loading}>
        Add filter
      </Button>
    </Stack>
  );
};
