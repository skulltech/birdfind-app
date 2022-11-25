import { Group, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { Dispatch, SetStateAction, useState } from "react";
import { Filters } from "../lib/utils/helpers";

export type FilterFormProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export const FilterForm = ({ filters, setFilters }: FilterFormProps) => {
  const [followedByInput, setFollowedByInput] = useState("");
  const [followerOfInput, setFollowerOfInput] = useState("");

  const handleFollowedByEnter = () => {
    if (followedByInput.length) {
      setFilters({
        ...filters,
        followedBy: [...(filters.followedBy ?? []), followedByInput],
      });
      setFollowedByInput("");
    }
  };

  const handleFollowerOfEnter = () => {
    if (followerOfInput.length) {
      setFilters({
        ...filters,
        followerOf: [...(filters.followerOf ?? []), followerOfInput],
      });
      setFollowerOfInput("");
    }
  };

  return (
    <Group>
      <TextInput
        label="Followed by"
        value={followedByInput}
        onChange={(event) => setFollowedByInput(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleFollowedByEnter]])}
      />
      <TextInput
        label="Follower of"
        value={followerOfInput}
        onChange={(event) => setFollowerOfInput(event.currentTarget.value)}
        onKeyDown={getHotkeyHandler([["Enter", handleFollowerOfEnter]])}
      />
    </Group>
  );
};
