import { Kbd, Loader, Stack, Text, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import axios from "axios";
import { useState } from "react";
import { Filters } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";

const parseFiltersJson = (obj: any): Filters => {
  if (obj.createdBefore) obj["createdBefore"] = new Date(obj.createdBefore);
  if (obj.createdAfter) obj["createdAfter"] = new Date(obj.createdAfter);
  return obj;
};

export const PromptInput = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { addFilters } = useTwips();

  const handleSubmit = async () => {
    if (prompt.length > 0) {
      setLoading(true);

      const res = await axios.get("/api/twips/prompt-to-filters", {
        params: { prompt },
      });
      const filters = parseFiltersJson(res.data.filters);
      console.log(filters);
      addFilters(filters);

      setPrompt("");
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Text>Prompt</Text>
      <TextInput
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
        rightSection={loading ? <Loader size="xs" /> : <Kbd>Enter</Kbd>}
        rightSectionWidth={loading ? undefined : 60}
      />
    </Stack>
  );
};
