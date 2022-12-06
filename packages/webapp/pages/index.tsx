import { searchUser } from "../utils/twips-api";
import { useState } from "react";
import { Filters, TwitterUser } from "@twips/lib";
import { Button, Group, Stack } from "@mantine/core";
import { FilterForm } from "../components/FilterForm";
import { FilterChipGroup } from "../components/FilterChips/FilterChipGroup";
import { IconSearch } from "@tabler/icons";
import { UserTable } from "../components/UserTable/UserTable";
import { usernameFilters } from "../utils/components";

const Home = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<TwitterUser[]>([]);

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const users = await searchUser(filters);
      setUsers(users);
    } catch (error) {
      console.log(error);
    }
    setSearchLoading(false);
  };

  const handleAddFilter = (
    filterName: string,
    filterValue: Date | number | string
  ) => {
    if (usernameFilters.includes(filterName)) {
      setFilters({
        ...filters,
        [filterName]: Array.from(
          new Set([...(filters[filterName] ?? []), filterValue])
        ),
      });
    } else {
      setFilters({ ...filters, [filterName]: filterValue });
    }
  };

  return (
    <Stack>
      <FilterForm onSubmit={handleAddFilter} />
      {Object.keys(filters).length ? (
        <Stack>
          <FilterChipGroup
            filters={filters}
            setFilters={setFilters}
            groupProps={{ position: "center" }}
          />
          <Group position="center">
            <Button
              leftIcon={<IconSearch />}
              size="lg"
              variant="default"
              loading={searchLoading}
              onClick={handleSearch}
              radius="xl"
            >
              Search users
            </Button>
          </Group>
        </Stack>
      ) : null}
      {users.length ? <UserTable users={users} /> : null}
    </Stack>
  );
};

export default Home;
