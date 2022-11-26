import {
  AppShell,
  Button,
  Divider,
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
import { Filters } from "../lib/utils/helpers";

const Home = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const handleSearch = async () => {
    setSearchLoading(true);
    setUsers(await callSearchApi(filters));
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
          <Title>
            <IconBrandTwitter />
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
        <FilterChipGroup filters={filters} setFilters={setFilters} />
        <Divider />
        <Group position="right">
          <Button
            leftIcon={<IconSearch />}
            variant="gradient"
            loading={searchLoading}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Group>

        <ScrollArea>
          <UserTable users={users} />
        </ScrollArea>
      </Stack>
    </AppShell>
  );
};

export default Home;
