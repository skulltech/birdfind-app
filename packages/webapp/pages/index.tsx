import { useEffect, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { useTwips } from "../components/TwipsProvider";
import { Center, Container, LoadingOverlay, Stack, Text } from "@mantine/core";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";

const Home = () => {
  const {
    user,
    userLoading,
    addFilters,
    searchResults,
    searchLoading,
    filtersInvalid,
  } = useTwips();
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

  return filtersInvalid && !userLoading ? (
    <Container mt={100}>
      <Center>
        <Stack align="center" spacing="xs">
          <Text weight="bold">Insufficient Filters</Text>
          <Text>
            Please select filters from the left panel or type it in natural
            language above
          </Text>
        </Stack>
      </Center>
    </Container>
  ) : (
    <div style={{ position: "relative" }}>
      <LoadingOverlay
        visible={searchLoading || initialFiltersLoading || userLoading}
        overlayBlur={2}
      />
      <UserTable users={searchResults} />
    </div>
  );
};

export default Home;
