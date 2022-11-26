import { Group } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { Filters } from "../../lib/utils/helpers";
import { FilterChip } from "./FilterChip";
import { FlattenedFilter, flattenFilters } from "../helpers";

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
    if (name == "followedBy" || name == "followerOf")
      setFilters({
        ...filters,
        [name]: filters[name].filter((x) => x != value),
      });
    else {
      const updatedFilters = { ...filters };
      delete updatedFilters[name];
      setFilters(updatedFilters);
    }
  };

  return (
    <Group>
      {flattenFilters(filters).map((filter, index) => (
        <FilterChip key={index} filter={filter} onClose={handleRemoveFilter} />
      ))}
    </Group>
  );
};
