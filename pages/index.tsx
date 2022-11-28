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
import { callSearchApi, TwitterUser } from "../components/helpers";
import { TwitterUserProfile } from "../components/UserTable/TwitterUserProfile";
import { UserTable } from "../components/UserTable/UserTable";
import { Filters } from "../lib/utils/helpers";

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
        <TwitterUserProfile
          name="Sumit Ghosh"
          username="summitkg"
          description="billionaire media tycoon and exiled mayor of san francisco. vp @foundersfund. ringleader @hereticon. editor-in-chief @piratewires 🏴‍☠️"
          profileImageUrl="https://pbs.twimg.com/profile_images/1575113474090635264/byE4nvpC_400x400.jpg"
        />
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

        {users.length ? (
          // <ScrollArea style={{ height: "75vh" }}>
          <UserTable users={users} />
        ) : // </ScrollArea>
        null}
      </Stack>
    </AppShell>
  );
};

export default Home;
