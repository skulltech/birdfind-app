import { Navbar, ScrollArea, Space, Stack, Title } from "@mantine/core";
import { useEffect } from "react";
import { FilterChipGroup } from "./FilterChips/FilterChipGroup";
import { DateRangeInput } from "./FilterInputs/DateRangeInput";
import { NumberRangeInput } from "./FilterInputs/NumberRangeInput";
import { UsernameInput } from "./FilterInputs/UsernameInput";
import { useTwips } from "./TwipsProvider";

export const AppNavbar = () => {
  const { user, filters } = useTwips();

  useEffect(() => {
    console.log(filters);
  }, [filters]);

  return (
    user &&
    user.twitter && (
      <Navbar width={{ base: 350 }} p="xs" pr={0}>
        <ScrollArea pr="md">
          <Navbar.Section>
            <Stack>
              <Title order={4}>Select Filters</Title>
              <FilterChipGroup />
              <Space />
              <UsernameInput direction="followers" label="Follower of" />
              <UsernameInput direction="following" label="Followed by" />
              <NumberRangeInput label="Followers count" metric="followers" />
              <NumberRangeInput label="Following count" metric="following" />
              <NumberRangeInput label="Tweet count" metric="tweet" />
              <DateRangeInput label="Account creation date" />
            </Stack>
          </Navbar.Section>
        </ScrollArea>
      </Navbar>
    )
  );
};
