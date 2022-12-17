import { Checkbox } from "@mantine/core";
import { useEffect, useState } from "react";
import { FilterInputProps } from "../../utils/helpers";
import { useTwips } from "../TwipsProvider";

interface CheckboxInputProps extends FilterInputProps {
  relation: "blocked" | "muted" | "follower" | "followed";
}

export const CheckboxInput = ({ label, relation }: CheckboxInputProps) => {
  const [checked, setChecked] = useState(false);
  const { filters, addFilters, removeFilters, user } = useTwips();

  const addFilter = () => {
    if (relation == "blocked")
      addFilters({ blockedBy: [user.twitter.username] });
    else if (relation == "muted")
      addFilters({ mutedBy: [user.twitter.username] });
    else if (relation == "follower")
      addFilters({ followerOf: [user.twitter.username] });
    else if (relation == "followed")
      addFilters({ followedBy: [user.twitter.username] });
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
      label={label}
      checked={checked}
      onChange={(event) =>
        event.currentTarget.checked ? addFilter() : removeFilter()
      }
    />
  );
};
