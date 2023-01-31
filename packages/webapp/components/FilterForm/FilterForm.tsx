import {
  Button,
  Group,
  HoverCard,
  Popover,
  Stack,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconCirclePlus } from "@tabler/icons";
import { SetStateAction, useState } from "react";
import { FilterChipGroup } from "./FilterChipGroup";
import { AgeSliderInput } from "./FilterInputs/AgeSliderInput";
import { NumberRangeInput } from "./FilterInputs/NumberRangeInput";
import { SearchTextInput } from "./FilterInputs/SearchTextInput";

export type Filters = {
  // Profile filters
  followersCountLessThan?: number;
  followersCountGreaterThan?: number;
  followingCountLessThan?: number;
  followingCountGreaterThan?: number;
  tweetCountLessThan?: number;
  tweetCountGreaterThan?: number;
  userCreatedBefore?: Date;
  userCreatedAfter?: Date;
  userSearchText?: string;
  // Tweet filters
  retweetCountLessThan?: number;
  retweetCountGreaterThan?: number;
  likeCountLessThan?: number;
  likeCountGreaterThan?: number;
  replyCountLessThan?: number;
  replyCountGreaterThan?: number;
  quoteCountLessThan?: number;
  quoteCountGreaterThan?: number;
  tweetCreatedBefore?: Date;
  tweetCreatedAfter?: Date;
  tweetSearchText?: string;
};

type FilterItemProps = {
  label: string;
  children: React.ReactNode;
};

const FilterMenuItem = ({ label, children }: FilterItemProps) => {
  const theme = useMantineTheme();

  return (
    <HoverCard position="right-start" withArrow closeDelay={50} openDelay={0}>
      <HoverCard.Target>
        <UnstyledButton
          style={{
            padding: theme.spacing.xs,
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSizes.sm,
          }}
          className="hover"
        >
          {label}
        </UnstyledButton>
      </HoverCard.Target>
      <HoverCard.Dropdown>{children}</HoverCard.Dropdown>
    </HoverCard>
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
            variant="outline"
            style={{
              fontSize: 16,
              fontWeight: 400,
              height: 30,
            }}
            radius="lg"
            onClick={() => setOpened((o) => !o)}
            leftIcon={<IconCirclePlus size={18} />}
          >
            Add filter
          </Button>
        </Popover.Target>
        <Popover.Dropdown p={4}>
          <Stack spacing={0}>
            <FilterMenuItem label="Bio contains keyword">
              <SearchTextInput
                label="Show accounts with bio containing"
                onSubmit={(x) => addFilters({ userSearchText: x })}
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
                label="Show accounts with age between"
                onSubmit={({ minDate, maxDate }) =>
                  addFilters({
                    userCreatedAfter: minDate,
                    userCreatedBefore: maxDate,
                  })
                }
              />
            </FilterMenuItem>

            <FilterMenuItem label="Tweet age">
              <AgeSliderInput
                label="Show tweets with age between"
                onSubmit={({ minDate, maxDate }) =>
                  addFilters({
                    tweetCreatedAfter: minDate,
                    tweetCreatedBefore: maxDate,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Likes count">
              <NumberRangeInput
                label="Show tweets with likes between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    likeCountGreaterThan: minValue,
                    likeCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Retweets count">
              <NumberRangeInput
                label="Show tweets with retweets between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    retweetCountGreaterThan: minValue,
                    retweetCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>

            <FilterMenuItem label="Replies count">
              <NumberRangeInput
                label="Show tweets with replies between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    replyCountGreaterThan: minValue,
                    replyCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Quotes count">
              <NumberRangeInput
                label="Show tweets with quotes between"
                onSubmit={({ minValue, maxValue }) =>
                  addFilters({
                    quoteCountGreaterThan: minValue,
                    quoteCountLessThan: maxValue,
                  })
                }
              />
            </FilterMenuItem>
            <FilterMenuItem label="Tweet contains keyword">
              <SearchTextInput
                label="Show tweets with text containing"
                onSubmit={(x) => addFilters({ tweetSearchText: x })}
              />
            </FilterMenuItem>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
};
