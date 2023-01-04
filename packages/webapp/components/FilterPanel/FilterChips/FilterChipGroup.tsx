import { Stack } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { RemoveFiltersArg } from "../../../pages/search";
import { FilterProps } from "../../../utils/helpers";
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
}: RenderRangeFilterArgs<Date>) =>
  min && max
    ? `${label} between ${formatDate(min)} to ${formatDate(max)}`
    : max
    ? `${label} before ${formatDate(max)}`
    : min
    ? `${label} after ${formatDate(min)}`
    : null;

const renderNumberRangeFilter = ({
  min,
  max,
  label,
}: RenderRangeFilterArgs<number>) =>
  min && max
    ? `${label} ${min} to ${max}`
    : max
    ? `${label} 0 to ${max}`
    : min
    ? `${label} ${min} to ∞`
    : null;

export const FilterChipGroup = ({ filters, removeFilters }: FilterProps) => {
  const [chips, setChips] = useState<Chip[]>([]);

  // Render all the chips
  useEffect(() => {
    const chips: Chip[] = [];

    // Followed by
    filters.followedBy?.forEach((x) => {
      chips.push({
        label: `Followed by @${x}`,
        filtersToRemove: [{ name: "followedBy", value: new Set([x]) }],
      });
    });

    // Follower of
    filters.followerOf?.forEach((x) => {
      chips.push({
        label: `Follower of @${x}`,
        filtersToRemove: [{ name: "followerOf", value: new Set([x]) }],
      });
    });

    // Followers count
    if (
      filters.followersCountGreaterThan != null ||
      filters.followersCountLessThan != null
    )
      chips.push({
        label: renderNumberRangeFilter({
          min: filters.followersCountGreaterThan,
          max: filters.followersCountLessThan,
          label: "Followers count",
        }),
        filtersToRemove: [
          { name: "followersCountLessThan" },
          { name: "followersCountGreaterThan" },
        ],
      });

    // Following count
    if (
      filters.followingCountGreaterThan != null ||
      filters.followingCountLessThan != null
    )
      chips.push({
        label: renderNumberRangeFilter({
          min: filters.followingCountGreaterThan,
          max: filters.followingCountLessThan,
          label: "Following count",
        }),
        filtersToRemove: [
          { name: "followingCountLessThan" },
          { name: "followingCountGreaterThan" },
        ],
      });

    // Tweet count
    if (
      filters.tweetCountGreaterThan != null ||
      filters.tweetCountLessThan != null
    )
      chips.push({
        label: renderNumberRangeFilter({
          min: filters.tweetCountGreaterThan,
          max: filters.tweetCountLessThan,
          label: "Tweet count",
        }),
        filtersToRemove: [
          { name: "tweetCountGreaterThan" },
          { name: "tweetCountLessThan" },
        ],
      });

    // Joined on
    if (filters.createdAfter != null || filters.createdBefore != null)
      chips.push({
        label: renderDateRangeFilter({
          min: filters.createdAfter,
          max: filters.createdBefore,
          label: "Joined",
        }),
        filtersToRemove: [{ name: "createdAfter" }, { name: "createdBefore" }],
      });

    // Muted by me
    if (filters.mutedByMe)
      chips.push({
        label: "Muted by you",
        filtersToRemove: [{ name: "mutedByMe" }],
      });

    // Blocked by me
    if (filters.blockedByMe)
      chips.push({
        label: "Blocked by you",
        filtersToRemove: [{ name: "blockedByMe" }],
      });

    // Search text
    if (filters.searchText)
      chips.push({
        label: `Profile contains "${filters.searchText}"`,
        filtersToRemove: [{ name: "searchText" }],
      });

    setChips(chips);
  }, [filters]);

  return (
    <Stack>
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
