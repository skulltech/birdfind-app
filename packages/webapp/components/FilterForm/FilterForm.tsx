import {
  Button,
  createStyles,
  Group,
  Popover,
  Stack,
  UnstyledButton,
} from "@mantine/core";
import { SetStateAction, useState } from "react";
import { FilterChipGroup } from "./FilterChipGroup";
import { AgeSliderInput } from "./FilterInputs/AgeSliderInput";
import { NumberRangeInput } from "./FilterInputs/NumberRangeInput";
import { SearchTextInput } from "./FilterInputs/SearchTextInput";

export type Filters = {
  followersCountLessThan?: number;
  followersCountGreaterThan?: number;
  followingCountLessThan?: number;
  followingCountGreaterThan?: number;
  tweetCountLessThan?: number;
  tweetCountGreaterThan?: number;
  userCreatedBefore?: Date;
  userCreatedAfter?: Date;
  searchText?: string;
};

const useStyles = createStyles((theme) => ({
  menuItem: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.white,
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.sm,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[0],
    },
  },
}));

type FilterItemProps = {
  label: string;
  children: React.ReactNode;
};

const FilterMenuItem = ({ label, children }: FilterItemProps) => {
  const { classes } = useStyles();

  return (
    <Popover position="right-start" withArrow>
      <Popover.Target>
        <UnstyledButton className={classes.menuItem}>{label}</UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
};

type FilterFormProps = {
  filters: Filters;
  setFilters: (arg: SetStateAction<Filters>) => Promise<void>;
};

export const FilterForm = ({ filters, setFilters }: FilterFormProps) => {
  const [opened, setOpened] = useState(false);

  // Reducer function for adding filters
  const addFilters = async (arg: Filters) => {
    await setFilters((filters) => {
      const updatedFilters = { ...filters };

      for (const [filterName, filterValue] of Object.entries(arg))
        if (filterValue !== undefined && filterValue !== null)
          updatedFilters[filterName] = filterValue;

      return updatedFilters;
    });
    setOpened(false);
  };

  return (
    <Group>
      {Object.keys(filters).length > 0 && (
        <FilterChipGroup filters={filters} setFilters={setFilters} />
      )}
      <Popover opened={opened} onChange={setOpened}>
        <Popover.Target>
          <Button
            py={3}
            variant="outline"
            style={{
              fontSize: 16,
              fontWeight: 400,
              height: 30,
            }}
            radius="lg"
            onClick={() => setOpened((o) => !o)}
          >
            + Add filter
          </Button>
        </Popover.Target>
        <Popover.Dropdown p={4}>
          <Stack spacing={0}>
            <FilterMenuItem label="Bio contains keyword">
              <SearchTextInput
                onSubmit={(x) => addFilters({ searchText: x })}
              />
            </FilterMenuItem>
            <FilterMenuItem label="Followers count">
              <NumberRangeInput
                label="Show accounts with followers count between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    followersCountGreaterThan: minValue,
                    followersCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Following count">
              <NumberRangeInput
                label="Show accounts with following count between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    followingCountGreaterThan: minValue,
                    followingCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Tweet count">
              <NumberRangeInput
                label="Show accounts with tweet count between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    tweetCountGreaterThan: minValue,
                    tweetCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Account age">
              <AgeSliderInput
                onSubmit={({ minDate, maxDate }) =>
                  addFilters({
                    userCreatedAfter: minDate,
                    userCreatedBefore: maxDate,
                  })
                }
              />
            </FilterMenuItem>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
};
