import { Group, Stack } from "@mantine/core";
import dayjs from "dayjs";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Chip } from "../Chip";
import { Filters } from "./FilterForm";

type FilterName = keyof Filters;

type ChipInfo = {
  label: string;
  filtersToRemove: FilterName[];
};

type RenderRangeFilterArgs<T = number | string> = {
  min: T;
  max: T;
  label: string;
};

const renderRangeFilter = ({ min, max, label }: RenderRangeFilterArgs) =>
  min && max
    ? `${label} ${min} to ${max}`
    : max
    ? `${label} 0 to ${max}`
    : min
    ? `${label} ${min} to ∞`
    : null;

type FilterChipGroupProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export const FilterChipGroup = ({
  filters,
  setFilters,
}: FilterChipGroupProps) => {
  const [chips, setChips] = useState<ChipInfo[]>([]);

  const dateToAge = (date: Date) => dayjs().from(date, true);

  // Reducer function for removing filters
  const removeFilters = (args: FilterName[]) =>
    setFilters((filters) => {
      const updatedFilters = { ...filters };
      for (const arg of args) delete updatedFilters[arg];
      return updatedFilters;
    });

  // Render all the chips
  useEffect(() => {
    const chips: ChipInfo[] = [];

    // Followers count
    if (
      filters.followersCountGreaterThan != null ||
      filters.followersCountLessThan != null
    )
      chips.push({
        label: renderRangeFilter({
          min: filters.followersCountGreaterThan,
          max: filters.followersCountLessThan,
          label: "Followers count",
        }),
        filtersToRemove: [
          "followersCountLessThan",
          "followersCountGreaterThan",
        ],
      });

    // Following count
    if (
      filters.followingCountGreaterThan != null ||
      filters.followingCountLessThan != null
    )
      chips.push({
        label: renderRangeFilter({
          min: filters.followingCountGreaterThan,
          max: filters.followingCountLessThan,
          label: "Following count",
        }),
        filtersToRemove: [
          "followingCountLessThan",
          "followingCountGreaterThan",
        ],
      });

    // Tweet count
    if (
      filters.tweetCountGreaterThan != null ||
      filters.tweetCountLessThan != null
    )
      chips.push({
        label: renderRangeFilter({
          min: filters.tweetCountGreaterThan,
          max: filters.tweetCountLessThan,
          label: "Tweet count",
        }),
        filtersToRemove: ["tweetCountGreaterThan", "tweetCountLessThan"],
      });

    // Joined on
    if (filters.createdAfter != null || filters.createdBefore != null)
      chips.push({
        label: renderRangeFilter({
          min: dateToAge(filters.createdBefore),
          max: dateToAge(filters.createdAfter),
          label: "Account age",
        }),
        filtersToRemove: ["createdAfter", "createdBefore"],
      });

    // Search text
    if (filters.searchText)
      chips.push({
        label: `Bio contains "${filters.searchText}"`,
        filtersToRemove: ["searchText"],
      });

    setChips(chips);
  }, [filters]);

  return (
    <Group>
      {chips.map(({ label, filtersToRemove }, index) => (
        <Chip
          key={index}
          label={label}
          onClose={() => removeFilters(filtersToRemove)}
        />
      ))}
    </Group>
  );
};
