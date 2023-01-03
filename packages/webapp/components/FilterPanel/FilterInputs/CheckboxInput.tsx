import { Checkbox, Loader, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../../utils/helpers";
import { useTwipsSearch } from "../../../providers/TwipsSearchProvider";
import { useTwipsUser } from "../../../providers/TwipsUserProvider";

interface CheckboxInputProps extends FilterInputProps {
  relation: "blocked" | "muted" | "follower" | "followed";
}

export const CheckboxInput = ({ label, relation }: CheckboxInputProps) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useTwipsUser();
  const { filters, addFilters, removeFilters } = useTwipsSearch();

  const addFilter = async () => {
    setLoading(true);
    if (relation == "blocked")
      await addFilters({ blockedBy: [user.twitter.username] });
    else if (relation == "muted")
      await addFilters({ mutedBy: [user.twitter.username] });
    else if (relation == "follower")
      await addFilters({ followerOf: [user.twitter.username] });
    else if (relation == "followed")
      await addFilters({ followedBy: [user.twitter.username] });
    setLoading(false);
  };

  const removeFilter = () => {
    if (relation == "blocked")
      removeFilters({ blockedBy: [user.twitter.username] });
    else if (relation == "muted")
      removeFilters({ mutedBy: [user.twitter.username] });
    else if (relation == "follower")
      removeFilters({ followerOf: [user.twitter.username] });
    else if (relation == "followed")
      removeFilters({ followedBy: [user.twitter.username] });
  };

  useEffect(() => {
    if (relation == "blocked") setChecked(Boolean(filters.blockedBy?.length));
    else if (relation == "muted") setChecked(Boolean(filters.mutedBy?.length));
    else if (relation == "followed")
      setChecked(filters.followedBy?.includes(user.twitter.username) ?? false);
    else if (relation == "follower")
      setChecked(filters.followerOf?.includes(user.twitter.username) ?? false);
  }, [filters]);

  return (
    <Checkbox
      label={
        <Group align="center" spacing="xs">
          <Text>
            {label} <span style={{ color: "red" }}>*</span>
          </Text>
          {loading && <Loader variant="dots" />}
        </Group>
      }
      checked={checked}
      indeterminate={loading}
      onChange={(event) =>
        event.currentTarget.checked ? addFilter() : removeFilter()
      }
    />
  );
};
