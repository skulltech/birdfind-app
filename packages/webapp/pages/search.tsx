import { useEffect, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { useTwipsSearch } from "../providers/TwipsSearchProvider";
import { Container, Group, Stack, Text } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { IconAlertCircle } from "@tabler/icons";
import { FilterPanel } from "../components/FilterPanel/FilterPanel";
import { useTwipsUser } from "../providers/TwipsUserProvider";

const Search = () => {
  const { user, loading: userLoading } = useTwipsUser();
  const {
    addFilters,
    loading: searchLoading,
    filtersInvalid,
  } = useTwipsSearch();
  const [initialFiltersLoading, setInitialFiltersLoading] = useState(false);
  const supabase = useSupabaseClient();
  const router = useRouter();

  // Add user's following on first load of page
  useEffect(() => {
    const addInitialFilters = async () => {
      setInitialFiltersLoading(true);
      await addFilters({ followedBy: [user.twitter.username] });
      setInitialFiltersLoading(false);
    };

    if (user?.twitter?.username) addInitialFilters();
  }, [user]);

  // To check if user is signed out, to bypass middleware's limitation
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) router.push("/auth/signin");
    };

    loadUser();
  }, [router, supabase]);

  return (
    <Group noWrap spacing={0} pt="sm" align="start">
      <FilterPanel />
      {filtersInvalid && !userLoading ? (
        <Container>
          <Stack align="center" spacing="xs">
            <Group>
              <IconAlertCircle color="red" />
              <Text weight="bold">Insufficient Filters</Text>
            </Group>
            <Text>
              You have to select at least one{" "}
              <span style={{ fontFamily: "monospace" }}>followed by</span> or{" "}
              <span style={{ fontFamily: "monospace" }}>follower of</span>{" "}
              filters
            </Text>
            <Text>
              Please select filters from the left panel or type it in english
              above
            </Text>
          </Stack>
        </Container>
      ) : (
        <UserTable
          loading={searchLoading || initialFiltersLoading || userLoading}
        />
      )}
    </Group>
  );
};

export default Search;
