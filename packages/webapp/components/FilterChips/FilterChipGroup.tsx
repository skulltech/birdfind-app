import { Stack } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { RemoveFiltersArg, useTwips } from "../TwipsProvider";
import { FilterChip } from "./FilterChip";

type Chip = {
  label: string;
  filtersToRemove: RemoveFiltersArg[];
};

type RenderRangeFilterArgs<T> = {
  min: T;
  max: T;
  label: string;
};

const formatDate = (date: Date) => dayjs(date).format("DD/MM/YYYY");

const renderDateRangeFilter = ({
  min,
  max,
  label,
}: RenderRangeFilterArgs<Date>) => {
  if (min && max) return `${label} on ${formatDate(min)} to ${formatDate(max)}`;
  else if (max) return `${label} before ${formatDate(max)}`;
  else if (min) return `${label} after ${formatDate(min)}`;
};

const renderNumberRangeFilter = ({
  min,
  max,
  label,
}: RenderRangeFilterArgs<number>) => {
  if (min && max) return `${label} ${min} to ${max}`;
  else if (max) return `${label} 0 to ${max}`;
  else if (min) return `${label} ${min} to ∞`;
};

export const FilterChipGroup = (props) => {
  const { filters, removeFilters, user } = useTwips();
  const [chips, setChips] = useState<Chip[]>([]);

  useEffect(() => {
    const chips: Chip[] = [];

    const {
      followedBy,
      followerOf,
      followersCountGreaterThan,
      followersCountLessThan,
      followingCountGreaterThan,
      followingCountLessThan,
      tweetCountGreaterThan,
      tweetCountLessThan,
      createdAfter,
      createdBefore,
      mutedBy,
      blockedBy,
    } = filters;

    followedBy?.forEach((x) => {
      chips.push({
        label: `Followed by @${x}`,
        filtersToRemove: [{ followedBy: [x] }],
      });
    });
    followerOf?.forEach((x) => {
      chips.push({
        label: `Follower of @${x}`,
        filtersToRemove: [{ followerOf: [x] }],
      });
    });

    let chipLabel: string;

    chipLabel = renderNumberRangeFilter({
      min: followersCountGreaterThan,
      max: followersCountLessThan,
      label: "Followers count",
    });
    if (chipLabel)
      chips.push({
        label: chipLabel,
        filtersToRemove: [
          "followersCountLessThan",
          "followersCountGreaterThan",
        ],
      });

    chipLabel = renderNumberRangeFilter({
      min: followingCountGreaterThan,
      max: followingCountLessThan,
      label: "Following count",
    });
    if (chipLabel)
      chips.push({
        label: chipLabel,
        filtersToRemove: [
          "followingCountLessThan",
          "followingCountGreaterThan",
        ],
      });

    chipLabel = renderNumberRangeFilter({
      min: tweetCountGreaterThan,
      max: tweetCountLessThan,
      label: "Tweet count",
    });
    if (chipLabel)
      chips.push({
        label: chipLabel,
        filtersToRemove: ["tweetCountLessThan", "tweetCountGreaterThan"],
      });

    chipLabel = renderDateRangeFilter({
      min: createdAfter,
      max: createdBefore,
      label: "Account created",
    });
    if (chipLabel)
      chips.push({
        label: chipLabel,
        filtersToRemove: ["createdAfter", "createdBefore"],
      });

    if (mutedBy && mutedBy.length)
      chips.push({
        label: "Muted by you",
        filtersToRemove: [{ mutedBy: [user.twitter.username] }],
      });

    if (blockedBy && blockedBy.length)
      chips.push({
        label: "Blocked by you",
        filtersToRemove: [{ blockedBy: [user.twitter.username] }],
      });

    setChips(chips);
  }, [filters]);

  return (
    <Stack {...props}>
      {chips.map(({ label, filtersToRemove }, index) => (
        <FilterChip
          key={index}
          label={label}
          onClose={() => removeFilters(...filtersToRemove)}
        />
      ))}
    </Stack>
  );
};
