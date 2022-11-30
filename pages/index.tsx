import {
  AppShell,
  Button,
  Group,
  Header,
  Navbar,
  ScrollArea,
  Stack,
  Title,
} from "@mantine/core";
import { IconBrandTwitter, IconSearch } from "@tabler/icons";
import { useState } from "react";
import { FilterChipGroup } from "../components/FilterChips/FilterChipGroup";
import { FilterForm } from "../components/FilterForm/FilterForm";
import { callSearchApi } from "../components/helpers";
import { UserTable } from "../components/UserTable/UserTable";
import { Filters, TwitterUser } from "../lib/utils/types";

const Home = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<TwitterUser[]>([]);

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

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 300 }} p="xs">
          <Navbar.Section>
            <Title align="center" order={3} p="lg">
              Filters
            </Title>
          </Navbar.Section>
          <Navbar.Section grow component={ScrollArea} mx="-xs" px="xs">
            <FilterForm filters={filters} setFilters={setFilters} />
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={60} p="xs">
          <Title order={2}>
            <Group>
              <IconBrandTwitter />
              Twips
            </Group>
          </Title>
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

export default Home;
