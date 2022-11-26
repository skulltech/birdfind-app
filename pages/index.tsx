import { Group, List, Stack, TextInput } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { FilterChipGroup } from "../components/FilterChips/FilterChipGroup";
import { FilterForm } from "../components/FilterForm/FilterForm";
import { Filters } from "../lib/utils/helpers";

const Home = () => {
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    console.log(filters);
  }, [filters]);

  return (
    <Stack>
      <FilterChipGroup filters={filters} setFilters={setFilters} />
      <FilterForm filters={filters} setFilters={setFilters} />
    </Stack>
  );
};

export default Home;
