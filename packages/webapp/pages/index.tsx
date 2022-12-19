import { useEffect, useState } from "react";
import { UserTable } from "../components/UserTable/UserTable";
import { useTwips } from "../components/TwipsProvider";
import { Center, Container, LoadingOverlay, Stack, Text } from "@mantine/core";

const Home = () => {
  const { user, addFilters, searchResults, searchLoading, filtersInvalid } =
    useTwips();
  const [initialFiltersLoading, setInitialFiltersLoading] = useState(false);

  // Add user's following on first load of page
  useEffect(() => {
    const addInitialFilters = async () => {
      setInitialFiltersLoading(true);
      await addFilters({ followedBy: [user.twitter.username] });
      setInitialFiltersLoading(false);
    };

    if (user?.twitter?.username) addInitialFilters();
  }, [user]);

  return filtersInvalid ? (
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
        visible={searchLoading || initialFiltersLoading}
        overlayBlur={2}
      />
      <UserTable users={searchResults} />
    </div>
  );
};

export default Home;
