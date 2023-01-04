import { Divider, Navbar, ScrollArea, Stack, Title } from "@mantine/core";
import { FilterProps } from "../../utils/helpers";
import { FilterChipGroup } from "./FilterChips/FilterChipGroup";
import { CheckboxInput } from "./FilterInputs/CheckboxInput";
import { DateRangeInput } from "./FilterInputs/DateRangeInput";
import { NumberRangeInput } from "./FilterInputs/NumberRangeInput";
import { SearchTextInput } from "./FilterInputs/SearchTextInput";
import { UsernameInput } from "./FilterInputs/UsernameInput";

export const FilterPanel = (props: FilterProps) => {
  return (
    <Navbar width={{ base: 300 }} p="xs" pr={0}>
      <ScrollArea pr="md" style={{ height: "85vh" }}>
        <Navbar.Section>
          <Stack style={{ fontSize: 14 }}>
            {Boolean(Object.keys(props.filters).length) && (
              <>
                <Title order={4}>Applied Filters</Title>
                <FilterChipGroup {...props} />
                <Divider mt="md" />
              </>
            )}
            <Title order={4}>Select Filters</Title>

            <SearchTextInput {...props} />

            <CheckboxInput
              label="Blocked by you"
              relation="blocked"
              {...props}
            />
            <CheckboxInput label="Muted by you" relation="muted" {...props} />
            <CheckboxInput
              label="Followed by you"
              relation="followed"
              {...props}
            />
            <CheckboxInput
              label="Follower of you"
              relation="follower"
              {...props}
            />

            <UsernameInput
              direction="followers"
              label="Follower of"
              {...props}
            />
            <UsernameInput
              direction="following"
              label="Followed by"
              {...props}
            />
            <NumberRangeInput
              label="Followers count"
              metric="followers"
              {...props}
            />
            <NumberRangeInput
              label="Following count"
              metric="following"
              {...props}
            />
            <NumberRangeInput label="Tweet count" metric="tweet" {...props} />
            <DateRangeInput label="Joined on" {...props} />
          </Stack>
        </Navbar.Section>
      </ScrollArea>
    </Navbar>
  );
};
