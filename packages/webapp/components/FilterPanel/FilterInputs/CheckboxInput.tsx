import { Checkbox, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../../utils/helpers";
import { useUser } from "../../../providers/UserProvider";

interface CheckboxInputProps extends FilterInputProps {
  relation: "blocked" | "muted" | "follower" | "followed";
}

export const CheckboxInput = ({
  label,
  relation,
  filters,
  addFilters,
  removeFilters,
}: CheckboxInputProps) => {
  const [checked, setChecked] = useState(false);
  const { user } = useUser();

  const handleMarkChecked = () => {
    addFilters(
      relation == "blocked"
        ? { blockedByMe: true }
        : relation == "muted"
        ? { mutedByMe: true }
        : relation == "followed"
        ? { followedBy: new Set([user.twitter.username]) }
        : relation == "follower"
        ? { followerOf: new Set([user.twitter.username]) }
        : null
    );
  };

  const handleMarkUnchecked = () => {
    removeFilters(
      relation == "blocked"
        ? { name: "blockedByMe" }
        : relation == "muted"
        ? { name: "mutedByMe" }
        : relation == "followed"
        ? {
            name: "followedBy",
            value: new Set([user.twitter.username]),
          }
        : relation == "follower"
        ? {
            name: "followerOf",
            value: new Set([user.twitter.username]),
          }
        : null
    );
  };

  useEffect(() => {
    setChecked(
      Boolean(
        relation == "blocked"
          ? filters.blockedByMe
          : relation == "muted"
          ? filters.mutedByMe
          : relation == "followed"
          ? filters.followedBy?.has(user.twitter.username)
          : relation == "follower"
          ? filters.followerOf?.has(user.twitter.username)
          : null
      )
    );
  }, [filters]);

  return (
    <Checkbox
      label={
        <Group align="center" spacing="xs">
          <Text>
            {label} <span style={{ color: "red" }}>*</span>
          </Text>
        </Group>
      }
      checked={checked}
      onChange={(event) =>
        event.currentTarget.checked
          ? handleMarkChecked()
          : handleMarkUnchecked()
      }
    />
  );
};
