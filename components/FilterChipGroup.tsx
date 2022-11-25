import { Group } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { Filters } from "../lib/utils/helpers";
import { FilterChip } from "./FilterChip";
import { FlattenedFilter, flattenFilters } from "./helpers";

export type FilterChipGroupProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export const FilterChipGroup = ({
  filters,
  setFilters,
}: FilterChipGroupProps) => {
  const handleRemoveFilter = (filter: FlattenedFilter) => {
    const [name, value] = filter;
    if (name == "followedBy")
      setFilters({
        ...filters,
        followedBy: filters.followedBy.filter((x) => x != value),
      });
    if (name == "followerOf")
      setFilters({
        ...filters,
        followerOf: filters.followerOf.filter((x) => x != value),
      });
  };

  return (
    <Group>
      {flattenFilters(filters).map((filter, index) => (
        <FilterChip key={index} filter={filter} onClose={handleRemoveFilter} />
      ))}
    </Group>
  );
};
