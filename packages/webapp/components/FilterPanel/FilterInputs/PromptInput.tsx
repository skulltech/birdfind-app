import {
  Group,
  Kbd,
  Loader,
  Popover,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconAlertCircle, IconSearch } from "@tabler/icons";
import axios from "axios";
import { useState } from "react";
import { Filters } from "../../../utils/helpers";
import { useTwipsSearch } from "../../../providers/TwipsSearchProvider";

const parseFiltersJson = (obj: any): Filters => {
  if (obj.createdBefore) obj["createdBefore"] = new Date(obj.createdBefore);
  if (obj.createdAfter) obj["createdAfter"] = new Date(obj.createdAfter);
  return obj;
};

export const PromptInput = () => {
  const [prompt, setPrompt] = useState("");
  const [popoverOpened, setPopoverOpened] = useState(false);

  const [loading, setLoading] = useState(false);
  const { addFilters } = useTwipsSearch();

  const handleSubmit = async () => {
    if (prompt.length > 0) {
      setLoading(true);

      const res = await axios.get("/api/twips/prompt-to-filters", {
        params: { prompt },
      });
      if (res.status != 200)
        showNotification({
          title: "Sorry",
          message: "Failed to parse prompt",
          color: "red",
        });
      else {
        const filters = parseFiltersJson(res.data.filters);
        addFilters(filters);
      }

      setPrompt("");
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Text>Prompt</Text>
      <Popover
        opened={popoverOpened}
        position="bottom"
        width="target"
        transition="pop"
      >
        <Popover.Target>
          <div
            onFocusCapture={() => setPopoverOpened(true)}
            onBlurCapture={() => setPopoverOpened(false)}
          >
            <TextInput
              value={prompt}
              placeholder="mutuals less than 100 tweets"
              onChange={(event) => setPrompt(event.currentTarget.value)}
              onKeyDown={getHotkeyHandler([["Enter", handleSubmit]])}
              rightSection={loading ? <Loader size="xs" /> : <Kbd>Enter</Kbd>}
              rightSectionWidth={loading ? undefined : 60}
            />
          </div>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm">
            Type your query in english and let an AI deduce the required
            filters.
          </Text>
          <Group spacing={4}>
            <IconAlertCircle size={16} color="red" />
            <Text size="sm" c="dimmed">
              This feature is highly experimental.
            </Text>
          </Group>
        </Popover.Dropdown>
      </Popover>
    </Stack>
  );
};
