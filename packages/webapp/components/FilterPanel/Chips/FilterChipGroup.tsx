import { Stack } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { RemoveFiltersArg } from "../../../pages/search";
import { FilterProps } from "../../../utils/helpers";
import { Chip } from "./Chip";

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
        <Chip
          key={index}
          label={label}
          onClose={() => removeFilters(...filtersToRemove)}
        />
      ))}
    </Stack>
  );
};
