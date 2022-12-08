import { useEffect, useState } from "react";
import { Filters, searchTwitterProfiles, TwitterProfile } from "@twips/lib";
import { Button, Group, Stack } from "@mantine/core";
import { FilterForm } from "../components/FilterForm";
import { FilterChipGroup } from "../components/FilterChips/FilterChipGroup";
import { IconSearch } from "@tabler/icons";
import { UserTable } from "../components/UserTable/UserTable";
import { usernameFilters } from "../utils/helpers";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const Home = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [searchable, setSearchable] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<TwitterProfile[]>(null);
  const [selectedUsers, setSelectedUsers] = useState<TwitterProfile[]>([]);
  const supabase = useSupabaseClient();

  useEffect(() => {
    setSearchable(false);
    if (filters.followedBy?.length || filters.followerOf?.length)
      setSearchable(true);
  }, [filters]);

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const users = await searchTwitterProfiles(supabase, filters);
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
      <Stack>
        {Boolean(Object.keys(filters).length) && (
          <FilterChipGroup
            filters={filters}
            setFilters={setFilters}
            groupProps={{ position: "center" }}
          />
        )}
        <Group position="center">
          <Button
            leftIcon={<IconSearch />}
            size="lg"
            variant="outline"
            loading={searchLoading}
            onClick={handleSearch}
            disabled={!searchable}
          >
            Search
          </Button>
        </Group>
      </Stack>
      {users != null && (
        <UserTable
          users={users}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
        />
      )}
    </Stack>
  );
};

export default Home;
