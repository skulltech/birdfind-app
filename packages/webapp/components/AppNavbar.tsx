import { Divider, Navbar, ScrollArea, Stack, Title } from "@mantine/core";
import { FilterChipGroup } from "./FilterChips/FilterChipGroup";
import { CheckboxInput } from "./FilterInputs/CheckboxInput";
import { DateRangeInput } from "./FilterInputs/DateRangeInput";
import { NumberRangeInput } from "./FilterInputs/NumberRangeInput";
import { UsernameInput } from "./FilterInputs/UsernameInput";
import { useTwips } from "./TwipsProvider";

export const AppNavbar = ({ ...props }) => {
  const { user, filters } = useTwips();

  return (
    user &&
    user.twitter && (
      <Navbar width={{ base: 300 }} p="xs" pr={0} {...props}>
        <ScrollArea pr="md">
          <Navbar.Section>
            <Stack style={{ fontSize: 14 }}>
              {Boolean(Object.keys(filters).length) && (
                <>
                  <Title order={4}>Applied Filters</Title>
                  <FilterChipGroup />
                  <Divider mt="md" />
                </>
              )}
              <Title order={4}>Select Filters</Title>

              <CheckboxInput label="Blocked by you" action="block" />
              <CheckboxInput label="Muted by you" action="mute" />

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
