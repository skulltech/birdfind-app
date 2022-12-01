import {
  AppShell,
  Button,
  Group,
  Header,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { IconBrandTwitter, IconSearch } from "@tabler/icons";
import { useState } from "react";
import { FilterChipGroup } from "./FilterChips/FilterChipGroup";
import { FilterForm } from "./FilterForm";
import { callSearchApi, usernameFilters } from "./helpers";
import { UserTable } from "./UserTable/UserTable";
import { Filters, TwitterUser } from "@twips/lib";

export const SearchPage = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<TwitterUser[]>([]);
  const session = useSession();
  const supabase = useSupabaseClient();

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const users = await callSearchApi(filters);
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  };

  return (
    <AppShell
      padding="md"
      header={
        <Header height={60} p="xs">
          <Group position="apart">
            <Title order={2}>
              <Group>
                <IconBrandTwitter />
                Twips
              </Group>
            </Title>
            <Group>
              <Text>Signed in: {session.user.email}</Text>
              <Button onClick={handleLogout}>Logout</Button>
            </Group>
          </Group>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      <Stack>
        <FilterForm onSubmit={handleAddFilter} />
        {Object.keys(filters).length ? (
          <Stack>
            <FilterChipGroup filters={filters} setFilters={setFilters} />
            <Group position="right">
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
    </AppShell>
  );
};
