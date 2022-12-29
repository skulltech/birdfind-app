import { useEffect, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { useTwips } from "../components/TwipsProvider";
import { Group, LoadingOverlay, Stack, Text } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { IconAlertCircle } from "@tabler/icons";
import { FilterPanel } from "../components/FilterPanel/FilterPanel";

const Home = () => {
  const { user, userLoading, addFilters, searchLoading, filtersInvalid } =
    useTwips();
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
    <Group>
      <FilterPanel />
      {filtersInvalid && !userLoading ? (
        <Stack align="center" spacing="xs">
          <Group>
            <IconAlertCircle color="red" />
            <Text weight="bold">Insufficient Filters</Text>
          </Group>
          <Text>
            You have to select at least one{" "}
            <span style={{ fontFamily: "monospace" }}>followed by</span> or{" "}
            <span style={{ fontFamily: "monospace" }}>follower of</span> filters
          </Text>
          <Text>
            Please select filters from the left panel or type it in english
            above
          </Text>
        </Stack>
      ) : (
        <div style={{ position: "relative" }}>
          <LoadingOverlay
            visible={searchLoading || initialFiltersLoading || userLoading}
            overlayBlur={2}
          />
          <UserTable />
        </div>
      )}
    </Group>
  );
};

export default Home;
