import { Group, GroupProps } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { FilterChip } from "./FilterChip";
import { FlattenedFilter, flattenFilters } from "../../utils/components";
import { Filters } from "@twips/lib";

export type FilterChipGroupProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  groupProps?: GroupProps;
};

export const FilterChipGroup = ({
  filters,
  setFilters,
  groupProps = {},
}: FilterChipGroupProps) => {
  const handleRemoveFilter = (filter: FlattenedFilter) => {
    const [name, value] = filter;
    if (name == "followedBy" || name == "followerOf")
      setFilters({
        ...filters,
        [name]: filters[name].filter((x: string) => x != value),
      });
    else {
      const updatedFilters = { ...filters };
      delete updatedFilters[name];
      setFilters(updatedFilters);
    }
  };

  return (
    <Group {...groupProps}>
      {flattenFilters(filters).map((filter, index) => (
        <FilterChip key={index} filter={filter} onClose={handleRemoveFilter} />
      ))}
    </Group>
  );
};
